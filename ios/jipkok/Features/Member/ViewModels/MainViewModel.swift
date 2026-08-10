import Observation

@Observable
@MainActor
final class MainViewModel {
    
    var sort: MemberSort = .recent
    var genderFilter: GenderFilter = .all
    var errorMessage: String?
    
    private(set) var members: [Member] = []
    private(set) var isLoading = false
    
    private var nextCursor: String?
    private var loadTask: Task<Void, Never>?
    private var generation = 0
    
    var isShowingError: Bool {
        get { errorMessage != nil }
        set { if !newValue { errorMessage = nil } }
    }
    
    private let repository: MemberRepository
    
    init(repository: MemberRepository = MemberRepository()) {
        self.repository = repository
    }
    
    func loadIfNeeded() async {
        guard members.isEmpty, loadTask == nil else { return }
        
        await reload()
    }
    
    func reload() async {
        loadTask?.cancel()
        members = []
        nextCursor = nil
        
        await load(cursor: nil)
    }
    
    func loadMore() async {
        guard loadTask == nil, let cursor = nextCursor else { return }
        
        await load(cursor: cursor)
    }
    
    private func load(cursor: String?) async {
        generation += 1
        
        let generation = generation
        let sort = sort
        let genderFilter = genderFilter
        
        isLoading = true
        
        let task = Task {
            do {
                let page = try await repository.findMembers(sort: sort, gender: genderFilter, cursor: cursor)
                
                guard generation == self.generation else { return }
                
                members += page.members
                nextCursor = page.nextCursor
            } catch {
                guard generation == self.generation else { return }
                
                errorMessage = APIError.from(error).message
            }
        }
        
        loadTask = task
        
        await task.value
        
        guard generation == self.generation else { return }
        
        loadTask = nil
        isLoading = false
    }
}
