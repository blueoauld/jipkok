import Observation

private let debounce = Duration.milliseconds(300)

@Observable
@MainActor
final class ChatSearchViewModel {
    
    var keyword = ""
    var message: String?
    
    private(set) var rooms: [ChatRoom] = []
    private(set) var isLoading = false
    
    private var nextCursor: Int64?
    private var loadTask: Task<Void, Never>?
    private var generation = 0
    
    var isSearchable: Bool {
        !Nickname.trimmed(keyword).isEmpty
    }
    
    var displayState: DisplayState {
        if rooms.isEmpty {
            return isLoading ? .loading : .empty
        }
        
        return .content
    }
    
    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }
    
    private let repository: ChatRepository
    
    init(repository: ChatRepository = ChatRepository()) {
        self.repository = repository
    }
    
    func sanitizeKeyword() {
        keyword = Nickname.sanitized(keyword)
    }
    
    func search() async {
        loadTask?.cancel()
        nextCursor = nil
        
        guard isSearchable else {
            rooms = []
            isLoading = false
            
            return
        }
        
        await load(cursor: nil, waitsForTyping: true)
    }
    
    func loadMore() async {
        guard loadTask == nil, let cursor = nextCursor else { return }
        
        await load(cursor: cursor, waitsForTyping: false)
    }
    
    private func load(cursor: Int64?, waitsForTyping: Bool) async {
        generation += 1
        
        let generation = generation
        let keyword = Nickname.trimmed(keyword)
        
        isLoading = true
        
        let task = Task {
            do {
                if waitsForTyping {
                    try await Task.sleep(for: debounce)
                }
                
                let page = try await repository.searchRooms(keyword: keyword, cursor: cursor)
                
                guard generation == self.generation else { return }
                
                rooms = cursor == nil ? page.rooms : rooms + page.rooms
                nextCursor = page.nextCursor
            } catch {
                guard !error.isCancellation else { return }
                
                guard generation == self.generation else { return }
                
                message = APIError.from(error).message
            }
        }
        
        loadTask = task
        
        await task.value
        
        guard generation == self.generation else { return }
        
        loadTask = nil
        isLoading = false
    }
}

extension ChatSearchViewModel {
    
    static func preview(
        keyword: String = "",
        rooms: [ChatRoom] = [],
        isLoading: Bool = false
    ) -> ChatSearchViewModel {
        let viewModel = ChatSearchViewModel()
        viewModel.keyword = keyword
        viewModel.rooms = rooms
        viewModel.isLoading = isLoading
        viewModel.loadTask = Task {}
        return viewModel
    }
}
