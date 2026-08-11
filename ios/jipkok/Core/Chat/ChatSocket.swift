import Foundation

enum ChatSocketEvent {

    case connected
    case message(ChatMessage)
    case roomDeleted(roomId: Int)
}

@MainActor
final class ChatSocket {

    static let shared = ChatSocket()

    private static let endpoint = "/ws"
    private static let destination = "/user/queue/chat"
    private static let reconnectDelay = Duration.seconds(5)
    private static let heartbeatInterval = Duration.seconds(10)

    private var task: URLSessionWebSocketTask?
    private var receiveTask: Task<Void, Never>?
    private var heartbeatTask: Task<Void, Never>?
    private var reconnectTask: Task<Void, Never>?
    private var isActive = false
    private var continuations: [UUID: AsyncStream<ChatSocketEvent>.Continuation] = [:]

    private let tokenStore = TokenStore()

    func events() -> AsyncStream<ChatSocketEvent> {
        let (stream, continuation) = AsyncStream<ChatSocketEvent>.makeStream()
        let id = UUID()
        continuations[id] = continuation

        continuation.onTermination = { _ in
            Task { @MainActor [weak self] in
                self?.continuations[id] = nil
            }
        }

        return stream
    }

    func activate() {
        isActive = true

        connectIfNeeded()
    }

    func deactivate() {
        isActive = false

        disconnect()
    }

    private func connectIfNeeded() {
        guard isActive, task == nil,
              let token = tokenStore.accessToken,
              var components = URLComponents(url: APIConfiguration.baseURL, resolvingAgainstBaseURL: false)
        else { return }

        components.scheme = components.scheme == "https" ? "wss" : "ws"

        guard let url = components.url?.appending(path: Self.endpoint) else { return }

        let task = URLSession.shared.webSocketTask(with: url)
        self.task = task
        task.resume()

        send(
            """
            CONNECT
            accept-version:1.2
            host:\(components.host ?? "")
            heart-beat:10000,10000
            Authorization:Bearer \(token)

            \0
            """
        )
        startReceiving(on: task)
    }

    private func disconnect() {
        receiveTask?.cancel()
        receiveTask = nil
        heartbeatTask?.cancel()
        heartbeatTask = nil
        reconnectTask?.cancel()
        reconnectTask = nil
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
    }

    private func scheduleReconnect() {
        disconnect()

        guard isActive else { return }

        reconnectTask = Task {
            try? await Task.sleep(for: Self.reconnectDelay)

            guard !Task.isCancelled else { return }

            connectIfNeeded()
        }
    }

    private func startReceiving(on task: URLSessionWebSocketTask) {
        receiveTask = Task {
            while !Task.isCancelled {
                do {
                    let received = try await task.receive()

                    handle(received)
                } catch {
                    if !Task.isCancelled {
                        scheduleReconnect()
                    }

                    return
                }
            }
        }
    }

    private func handle(_ received: URLSessionWebSocketTask.Message) {
        let text: String

        switch received {
        case .string(let string): text = string
        case .data(let data): text = String(decoding: data, as: UTF8.self)
        @unknown default: return
        }

        guard let frame = StompFrame(text) else { return }

        switch frame.command {
        case "CONNECTED":
            subscribe()
            startHeartbeat()
            emit(.connected)
        case "MESSAGE":
            handleEvent(body: frame.body)
        case "ERROR":
            scheduleReconnect()
        default:
            break
        }
    }

    private func subscribe() {
        send(
            """
            SUBSCRIBE
            id:sub-0
            destination:\(Self.destination)

            \0
            """
        )
    }

    private func startHeartbeat() {
        heartbeatTask?.cancel()
        heartbeatTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(for: Self.heartbeatInterval)

                guard !Task.isCancelled else { return }

                send("\n")
            }
        }
    }

    private func handleEvent(body: String) {
        guard let payload = try? Self.decoder.decode(EventPayload.self, from: Data(body.utf8)) else { return }

        if payload.type == "ROOM_DELETED" {
            emit(.roomDeleted(roomId: Int(payload.roomId)))
        } else if let response = payload.message, let received = ChatMessage(response) {
            emit(.message(received))
        }
    }

    private func emit(_ event: ChatSocketEvent) {
        for continuation in continuations.values {
            continuation.yield(event)
        }
    }

    private func send(_ frame: String) {
        task?.send(.string(frame)) { _ in }
    }

    private struct EventPayload: Decodable {

        let type: String
        let roomId: Int64
        let message: Components.Schemas.ChatMessageResponse?
    }

    private static let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let string = try decoder.singleValueContainer().decode(String.self)

            if let date = try? Date.ISO8601FormatStyle(includingFractionalSeconds: true).parse(string) {
                return date
            }

            return try Date.ISO8601FormatStyle().parse(string)
        }
        return decoder
    }()
}

private struct StompFrame {

    let command: String
    let body: String

    init?(_ text: String) {
        let content = text.hasSuffix("\0") ? String(text.dropLast()) : text

        guard let headerEnd = content.range(of: "\n\n") else { return nil }

        let lines = content[..<headerEnd.lowerBound].split(separator: "\n", omittingEmptySubsequences: false)

        guard let first = lines.first, !first.isEmpty else { return nil }

        command = String(first)
        body = String(content[headerEnd.upperBound...])
    }
}
