import Foundation
import Observation

@Observable
@MainActor
final class MemberDetailViewModel {
    
    var message: String?
    var isConfirmingSecretPhoto = false
    var isConfirmingBlock = false
    var isViewingSecretPhotos = false
    
    private(set) var member: MemberDetail?
    private(set) var isLoading = false
    
    var displayState: DisplayState {
        if member == nil {
            return isLoading ? .loading : .empty
        }
        
        return .content
    }
    
    private var isTogglingLike = false
    private var isTogglingFavorite = false
    private(set) var isProcessing = false
    private(set) var secretPhotoURLs: [URL] = []
    
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
            guard !error.isCancellation else { return }
            
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
            
            guard !error.isCancellation else { return }
            
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
            guard !error.isCancellation else { return }
            
            message = APIError.from(error).message
        }
    }
    
    func openSecretPhotos() async {
        guard !isProcessing, let member else { return }
        
        guard member.isSecretPhotoGrantedToMe else {
            message = "비밀 사진이 공개되지 않았습니다."
            
            return
        }
        
        guard member.secretPhotoCount > 0 else {
            message = "공개된 비밀 사진이 없습니다."
            
            return
        }
        
        isProcessing = true
        
        defer { isProcessing = false }
        
        do {
            let urls = try await repository.findSecretPhotoURLs(id: id)
            
            guard !urls.isEmpty else {
                message = "공개된 비밀 사진이 없습니다."
                
                return
            }
            
            secretPhotoURLs = urls
            isViewingSecretPhotos = true
        } catch {
            guard !error.isCancellation else { return }
            
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
            guard !error.isCancellation else { return }
            
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
            
            guard !error.isCancellation else { return }
            
            message = APIError.from(error).message
        }
    }
}

extension MemberDetailViewModel {
    
    static func preview(
        member: MemberDetail? = nil,
        isLoading: Bool = false,
        isProcessing: Bool = false
    ) -> MemberDetailViewModel {
        let viewModel = MemberDetailViewModel(id: member?.id ?? 0)
        viewModel.member = member
        viewModel.isLoading = isLoading
        viewModel.isProcessing = isProcessing
        return viewModel
    }
}
