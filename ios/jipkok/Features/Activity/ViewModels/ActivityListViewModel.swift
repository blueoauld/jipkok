import Observation

@Observable
@MainActor
final class ActivityListViewModel {
    
    let kind: ActivityKind
    
    var message: String?
    
    private(set) var items: [ActivityItem] = []
    private(set) var isLoading = false
    private(set) var isProcessing = false
    
    private var nextCursor: String?
    private var hasLoaded = false
    private var hasShownAd = false
    
    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }
    
    var displayState: DisplayState {
        if items.isEmpty {
            return isLoading ? .loading : .empty
        }
        
        return .content
    }
    
    private let repository: ActivityRepository
    private let adManager: InterstitialAdManager
    
    init(
        kind: ActivityKind,
        repository: ActivityRepository = ActivityRepository(),
        adManager: InterstitialAdManager? = nil
    ) {
        self.kind = kind
        self.repository = repository
        self.adManager = adManager ?? InterstitialAdManager()
    }
    
    func loadIfNeeded() async {
        guard !hasLoaded, !isLoading else { return }
        
        await showAdIfNeeded()
        await reload()
    }
    
    private func showAdIfNeeded() async {
        guard kind.requiresAd, !hasShownAd else { return }
        
        isLoading = true
        
        defer { isLoading = false }
        
        await adManager.show()
        
        hasShownAd = true
    }
    
    func reload() async {
        guard !isLoading else { return }
        
        isLoading = true
        
        defer { isLoading = false }
        
        do {
            let page = try await repository.findItems(kind: kind, cursor: nil)
            items = page.items
            nextCursor = page.nextCursor
            hasLoaded = true
            
            await markSeenIfNeeded()
        } catch {
            guard !error.isCancellation else { return }
            
            message = APIError.from(error).message
        }
    }
    
    func loadMore() async {
        guard !isLoading, let cursor = nextCursor else { return }
        
        isLoading = true
        
        defer { isLoading = false }
        
        do {
            let page = try await repository.findItems(kind: kind, cursor: cursor)
            items += page.items
            nextCursor = page.nextCursor
        } catch {
            guard !error.isCancellation else { return }
            
            message = APIError.from(error).message
        }
    }
    
    func delete(_ item: ActivityItem) async {
        guard kind.isDeletable, !isProcessing else { return }
        
        isProcessing = true
        
        defer { isProcessing = false }
        
        do {
            try await repository.remove(kind: kind, memberId: item.member.id)
            
            items.removeAll { $0.id == item.id }
        } catch {
            guard !error.isCancellation else { return }
            
            message = APIError.from(error).message
        }
    }
    
    private func markSeenIfNeeded() async {
        guard kind == .profileView else { return }
        
        try? await repository.markProfileViewsSeen()
    }
}

extension ActivityListViewModel {
    
    static func preview(
        kind: ActivityKind = .like,
        items: [ActivityItem] = [],
        isLoading: Bool = false,
        isProcessing: Bool = false
    ) -> ActivityListViewModel {
        let viewModel = ActivityListViewModel(kind: kind)
        viewModel.items = items
        viewModel.isLoading = isLoading
        viewModel.isProcessing = isProcessing
        viewModel.hasLoaded = true
        return viewModel
    }
}
