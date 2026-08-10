import Observation

@Observable
@MainActor
final class MemberDetailViewModel {
    
    var message: String?
    var isConfirmingSecretPhoto = false
    var isConfirmingBlock = false
    
    private(set) var member: MemberDetail?
    private(set) var isLoading = false
    
    private var isTogglingLike = false
    private var isTogglingFavorite = false
    private(set) var isProcessing = false
    
    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }
    
    private let id: Int
    private let repository: MemberRepository
    
    init(id: Int, repository: MemberRepository = MemberRepository()) {
        self.id = id
        self.repository = repository
    }
    
    func loadIfNeeded() async {
        guard member == nil, !isLoading else { return }
        
        isLoading = true
        
        defer { isLoading = false }
        
        do {
            member = try await repository.findDetail(id: id)
        } catch {
            message = APIError.from(error).message
        }
    }
    
    func toggleLike() async {
        guard !isTogglingLike, let previous = member else { return }
        
        let isLiked = !previous.isLiked
        
        isTogglingLike = true
        member?.isLiked = isLiked
        member?.receivedLikeCount = max(0, previous.receivedLikeCount + (isLiked ? 1 : -1))
        
        defer { isTogglingLike = false }
        
        do {
            try await repository.setLiked(isLiked, id: id)
        } catch {
            member?.isLiked = previous.isLiked
            member?.receivedLikeCount = previous.receivedLikeCount
            message = APIError.from(error).message
        }
    }
    
    func toggleSecretPhoto() async {
        guard !isProcessing, let previous = member?.isSecretPhotoGrantedByMe else { return }
        
        let isGranted = !previous
        
        isProcessing = true
        
        defer { isProcessing = false }
        
        do {
            try await repository.setSecretPhotoGranted(isGranted, id: id)
            
            member?.isSecretPhotoGrantedByMe = isGranted
            message = isGranted ? "비밀 사진을 공개하셨습니다." : "비밀 사진을 비공개하셨습니다."
        } catch {
            message = APIError.from(error).message
        }
    }
    
    func toggleBlock() async {
        guard !isProcessing, let previous = member?.isBlocked else { return }
        
        let isBlocked = !previous
        
        isProcessing = true
        
        defer { isProcessing = false }
        
        do {
            try await repository.setBlocked(isBlocked, id: id)
            
            member?.isBlocked = isBlocked
            message = isBlocked ? "차단하셨습니다." : "차단을 해제하셨습니다."
        } catch {
            message = APIError.from(error).message
        }
    }
    
    func toggleFavorite() async {
        guard !isTogglingFavorite, let previous = member?.isFavorited else { return }
        
        isTogglingFavorite = true
        member?.isFavorited = !previous
        
        defer { isTogglingFavorite = false }
        
        do {
            try await repository.setFavorited(!previous, id: id)
        } catch {
            member?.isFavorited = previous
            message = APIError.from(error).message
        }
    }
}
