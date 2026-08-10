import Foundation
import Observation

@Observable
@MainActor
final class FeedViewModel {
    
    var sort: FeedSort = .latest
    var genderFilter: GenderFilter = .all
    var date = Date()
    var message: String?
    var reportingPost: FeedPost?
    
    private(set) var posts: [FeedPost] = []
    private(set) var isLoading = false
    private(set) var isNotificationEnabled = true
    private(set) var isProcessing = false
    private(set) var myMemberId: Int?
    
    private var nextCursor: Int64?
    private var generation = 0
    private var pendingLikeIds: Set<Int> = []
    private var hasLoaded = false
    
    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }
    
    var isConfirmingReport: Bool {
        get { reportingPost != nil }
        set { if !newValue { reportingPost = nil } }
    }
    
    var isEmpty: Bool {
        hasLoaded && posts.isEmpty
    }
    
    private let repository: FeedRepository
    
    init(repository: FeedRepository = FeedRepository()) {
        self.repository = repository
    }
    
    func loadIfNeeded() async {
        guard !hasLoaded else { return }
        
        async let myInfo = try? repository.findMyInfo()
        
        await reload()
        
        if let myInfo = await myInfo {
            myMemberId = myInfo.memberId
            isNotificationEnabled = myInfo.notificationEnabled
        }
    }
    
    func reload() async {
        generation += 1
        posts = []
        nextCursor = nil
        
        await load(cursor: nil)
    }
    
    func loadMore() async {
        guard !isLoading, let cursor = nextCursor else { return }
        
        await load(cursor: cursor)
    }
    
    func toggleLike(_ post: FeedPost) async {
        guard !pendingLikeIds.contains(post.id),
              let index = posts.firstIndex(where: { $0.id == post.id })
        else { return }
        
        let isLiked = !posts[index].isLiked
        
        pendingLikeIds.insert(post.id)
        posts[index].isLiked = isLiked
        
        defer { pendingLikeIds.remove(post.id) }
        
        do {
            try await repository.setLiked(isLiked, postId: post.id)
        } catch {
            if let index = posts.firstIndex(where: { $0.id == post.id }) {
                posts[index].isLiked = !isLiked
            }
            
            message = APIError.from(error).message
        }
    }
    
    func report(_ post: FeedPost) async {
        do {
            try await repository.report(postId: post.id)
            message = "신고가 접수되었습니다."
        } catch {
            message = APIError.from(error).message
        }
    }
    
    func toggleNotification() async {
        guard !isProcessing else { return }
        
        let enabled = !isNotificationEnabled
        
        isProcessing = true
        
        defer { isProcessing = false }
        
        do {
            try await repository.updateNotification(enabled: enabled)
            
            isNotificationEnabled = enabled
            message = enabled ? "이제 피드 알림을 받을 수 있습니다." : "이제 피드 알림을 받지 않습니다."
        } catch {
            message = APIError.from(error).message
        }
    }
    
    private func load(cursor: Int64?) async {
        let generation = generation
        let sort = sort
        let genderFilter = genderFilter
        let date = date
        
        isLoading = true
        
        do {
            let page = try await repository.findPosts(sort: sort, gender: genderFilter, date: date, cursor: cursor)
            
            guard generation == self.generation else { return }
            
            posts += page.posts
            nextCursor = page.nextCursor
            hasLoaded = true
        } catch {
            guard generation == self.generation else { return }
            
            message = APIError.from(error).message
        }
        
        guard generation == self.generation else { return }
        
        isLoading = false
    }
}
