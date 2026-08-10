import Observation
import UIKit

let feedCaptionMaxLength = 30

@Observable
@MainActor
final class FeedComposeViewModel {
    
    var caption = ""
    var message: String?
    
    private(set) var photo: UIImage?
    private(set) var isSubmitting = false
    private(set) var didSubmit = false
    
    var canSubmit: Bool {
        photo != nil && !isSubmitting
    }
    
    var isDirty: Bool {
        photo != nil || !caption.isEmpty
    }
    
    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }
    
    private let repository: FeedRepository
    
    init(repository: FeedRepository = FeedRepository()) {
        self.repository = repository
    }
    
    func sanitizeCaption() {
        caption = String(caption.prefix(feedCaptionMaxLength))
    }
    
    func selectPhoto(_ image: UIImage) {
        photo = image
    }
    
    func removePhoto() {
        photo = nil
    }
    
    func submit() async {
        guard canSubmit, let photo else { return }
        
        isSubmitting = true
        
        defer { isSubmitting = false }
        
        do {
            let objectKey = try await repository.uploadPhoto(photo)
            
            try await repository.createPost(objectKey: objectKey, caption: caption.isEmpty ? nil : caption)
            
            didSubmit = true
            message = "피드를 등록하셨습니다."
        } catch {
            guard !error.isCancellation else { return }
            
            message = APIError.from(error).message
        }
    }
}

extension FeedComposeViewModel {
    
    static func preview(
        hasPhoto: Bool = false,
        caption: String = "",
        isSubmitting: Bool = false
    ) -> FeedComposeViewModel {
        let viewModel = FeedComposeViewModel()
        viewModel.photo = hasPhoto ? previewImage : nil
        viewModel.caption = caption
        viewModel.isSubmitting = isSubmitting
        return viewModel
    }
    
    private static let previewImage = UIGraphicsImageRenderer(size: CGSize(width: 1_200, height: 600))
        .image { context in
            UIColor.systemGray3.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 1_200, height: 600))
        }
}
