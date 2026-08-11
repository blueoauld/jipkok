import Observation

@Observable
@MainActor
final class ChatViewModel {

    enum Filter: CaseIterable {
        case all
        case unread

        var label: String {
            switch self {
            case .all: "전체"
            case .unread: "안읽음"
            }
        }
    }

    var filter: Filter = .all
    var message: String?
    var leavingRoom: ChatRoom?

    private(set) var rooms: [ChatRoom] = []
    private(set) var isLoading = false
    private(set) var isNoteReceiveEnabled = true
    private(set) var isProcessing = false

    private var nextCursor: Int64?
    private var generation = 0
    private var hasLoaded = false
    private var pendingNotificationIds: Set<Int> = []

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    var isConfirmingLeave: Bool {
        get { leavingRoom != nil }
        set { if !newValue { leavingRoom = nil } }
    }

    var displayState: DisplayState {
        if rooms.isEmpty {
            return isLoading ? .loading : .empty
        }

        return .content
    }

    private let repository: ChatRepository

    init(repository: ChatRepository = ChatRepository()) {
        self.repository = repository
    }

    func loadIfNeeded() async {
        guard !hasLoaded else { return }

        async let noteReceive = try? repository.findNoteReceiveEnabled()

        await reload()

        if let noteReceive = await noteReceive {
            isNoteReceiveEnabled = noteReceive
        }
    }

    func reload() async {
        generation += 1
        rooms = []
        nextCursor = nil

        await load(cursor: nil)
    }

    func loadMore() async {
        guard !isLoading, let cursor = nextCursor else { return }

        await load(cursor: cursor)
    }

    func toggleNotification(_ room: ChatRoom) async {
        guard !pendingNotificationIds.contains(room.id),
              let index = rooms.firstIndex(where: { $0.id == room.id })
        else { return }

        let enabled = !rooms[index].isNotificationEnabled

        pendingNotificationIds.insert(room.id)
        rooms[index].isNotificationEnabled = enabled

        defer { pendingNotificationIds.remove(room.id) }

        do {
            try await repository.setNotificationEnabled(enabled, roomId: room.id)
        } catch {
            if let index = rooms.firstIndex(where: { $0.id == room.id }) {
                rooms[index].isNotificationEnabled = !enabled
            }

            guard !error.isCancellation else { return }

            message = APIError.from(error).message
        }
    }

    func leave(_ room: ChatRoom) async {
        guard !isProcessing else { return }

        isProcessing = true

        defer { isProcessing = false }

        do {
            try await repository.leave(roomId: room.id)

            rooms.removeAll { $0.id == room.id }
        } catch {
            guard !error.isCancellation else { return }

            message = APIError.from(error).message
        }
    }

    func toggleNoteReceive() async {
        guard !isProcessing else { return }

        let enabled = !isNoteReceiveEnabled

        isProcessing = true

        defer { isProcessing = false }

        do {
            try await repository.setNoteReceiveEnabled(enabled)

            isNoteReceiveEnabled = enabled
            message = enabled ? "이제 쪽지를 받을 수 있습니다." : "이제 쪽지를 받지 않습니다."
        } catch {
            guard !error.isCancellation else { return }

            message = APIError.from(error).message
        }
    }

    private func load(cursor: Int64?) async {
        let generation = generation
        let unreadOnly = filter == .unread

        isLoading = true

        do {
            let page = try await repository.findRooms(unreadOnly: unreadOnly, cursor: cursor)

            guard generation == self.generation else { return }

            rooms = cursor == nil ? page.rooms : rooms + page.rooms
            nextCursor = page.nextCursor
            hasLoaded = true
        } catch {
            if !error.isCancellation, generation == self.generation {
                message = APIError.from(error).message
            }
        }

        guard generation == self.generation else { return }

        isLoading = false
    }
}

extension ChatViewModel {

    static func preview(
        rooms: [ChatRoom] = [],
        isLoading: Bool = false
    ) -> ChatViewModel {
        let viewModel = ChatViewModel()
        viewModel.rooms = rooms
        viewModel.isLoading = isLoading
        viewModel.hasLoaded = true
        return viewModel
    }
}
