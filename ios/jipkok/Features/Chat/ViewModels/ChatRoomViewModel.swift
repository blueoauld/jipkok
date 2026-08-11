import Observation
import UIKit

private let messageMaxLength = 1000

@Observable
@MainActor
final class ChatRoomViewModel {

    let room: ChatRoom

    var draft = ""
    var message: String?
    var isRoomDeleted = false

    private(set) var messages: [ChatMessage] = []
    private(set) var isLoading = false
    private(set) var isSending = false
    private(set) var myMemberId: Int?

    private var nextCursor: Int64?
    private var hasLoaded = false

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    var displayState: DisplayState {
        if messages.isEmpty {
            return isLoading ? .loading : .empty
        }

        return .content
    }

    var canSend: Bool {
        !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSending
    }

    private let repository: ChatRepository

    init(room: ChatRoom, repository: ChatRepository = ChatRepository()) {
        self.room = room
        self.repository = repository
    }

    func sanitizeDraft() {
        draft = String(draft.prefix(messageMaxLength))
    }

    func loadIfNeeded() async {
        guard !hasLoaded, !isLoading else { return }

        isLoading = true

        defer { isLoading = false }

        async let memberId = try? repository.findMyMemberId()

        do {
            let page = try await repository.findMessages(roomId: room.id, cursor: nil)
            messages = page.messages.reversed()
            nextCursor = page.nextCursor
            hasLoaded = true
        } catch {
            guard !error.isCancellation else { return }

            message = APIError.from(error).message
        }

        if let memberId = await memberId {
            myMemberId = memberId
        }
    }

    func loadMore() async {
        guard !isLoading, let cursor = nextCursor else { return }

        isLoading = true

        defer { isLoading = false }

        do {
            let page = try await repository.findMessages(roomId: room.id, cursor: cursor)
            messages = page.messages.reversed() + messages
            nextCursor = page.nextCursor
        } catch {
            guard !error.isCancellation else { return }

            message = APIError.from(error).message
        }
    }

    func sendText() async {
        let content = draft.trimmingCharacters(in: .whitespacesAndNewlines)

        guard canSend, !content.isEmpty else { return }

        isSending = true
        draft = ""

        defer { isSending = false }

        do {
            let sent = try await repository.sendTextMessage(content, roomId: room.id)

            append(sent)
        } catch {
            draft = content

            guard !error.isCancellation else { return }

            message = APIError.from(error).message
        }
    }

    func sendPhoto(_ image: UIImage) async {
        guard !isSending else { return }

        isSending = true

        defer { isSending = false }

        do {
            let objectKey = try await repository.uploadPhoto(image)
            let sent = try await repository.sendPhotoMessage(objectKey: objectKey, roomId: room.id)

            append(sent)
        } catch {
            guard !error.isCancellation else { return }

            message = APIError.from(error).message
        }
    }

    func observeSocket() async {
        for await event in ChatSocket.shared.events() {
            switch event {
            case .message(let received) where received.roomId == room.id:
                append(received)
            case .roomDeleted(let roomId) where roomId == room.id:
                isRoomDeleted = true
            case .connected, .message, .roomDeleted:
                break
            }
        }
    }

    private func append(_ new: ChatMessage) {
        guard !messages.contains(where: { $0.id == new.id }) else { return }

        messages.append(new)
    }
}

extension ChatRoomViewModel {

    static func preview(
        room: ChatRoom = ChatRoom.samples[0],
        messages: [ChatMessage] = [],
        myMemberId: Int = 2,
        isLoading: Bool = false
    ) -> ChatRoomViewModel {
        let viewModel = ChatRoomViewModel(room: room)
        viewModel.messages = messages
        viewModel.myMemberId = myMemberId
        viewModel.isLoading = isLoading
        viewModel.hasLoaded = true
        return viewModel
    }
}
