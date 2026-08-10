import Observation
import UIKit

let reportPhotoMaxCount = 6
let reportDetailMaxLength = 1000

struct ReportPhoto: Identifiable {

    let objectKey: String
    let image: UIImage

    var id: String { objectKey }
}

@Observable
@MainActor
final class ReportViewModel {

    var reason: ReportReason?
    var detail = ""
    var message: String?

    private(set) var photos: [ReportPhoto] = []
    private(set) var isProcessing = false
    private(set) var isSubmitting = false
    private(set) var didSubmit = false

    var canAddPhoto: Bool {
        photos.count < reportPhotoMaxCount
    }

    var canSubmit: Bool {
        reason != nil && !isSubmitting
    }

    var isDirty: Bool {
        reason != nil || !detail.isEmpty || !photos.isEmpty
    }

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    private let memberId: Int
    private let roomId: Int?
    private let repository: ReportRepository

    init(memberId: Int, roomId: Int?, repository: ReportRepository = ReportRepository()) {
        self.memberId = memberId
        self.roomId = roomId
        self.repository = repository
    }

    func sanitizeDetail() {
        detail = String(detail.prefix(reportDetailMaxLength))
    }

    func addPhotos(_ images: [UIImage]) async {
        guard !isProcessing, !images.isEmpty else { return }

        isProcessing = true

        defer { isProcessing = false }

        for image in images {
            guard canAddPhoto else { break }

            do {
                let objectKey = try await repository.uploadPhoto(image)
                photos.append(ReportPhoto(objectKey: objectKey, image: image))
            } catch {
                guard !error.isCancellation else { break }

                message = APIError.from(error).message

                break
            }
        }
    }

    func removePhoto(_ photo: ReportPhoto) {
        photos.removeAll { $0.id == photo.id }
    }

    func submit() async {
        guard canSubmit, let reason else { return }

        isSubmitting = true

        defer { isSubmitting = false }

        do {
            try await repository.createReport(
                memberId: memberId,
                roomId: roomId,
                reason: reason,
                detail: detail.isEmpty ? nil : detail,
                photoKeys: photos.map(\.objectKey)
            )

            didSubmit = true
            message = "신고가 접수되었습니다."
        } catch {
            guard !error.isCancellation else { return }

            message = APIError.from(error).message
        }
    }
}

extension ReportViewModel {

    static func preview(
        reason: ReportReason? = nil,
        detail: String = "",
        photoCount: Int = 0,
        isSubmitting: Bool = false
    ) -> ReportViewModel {
        let viewModel = ReportViewModel(memberId: 1, roomId: nil)
        viewModel.reason = reason
        viewModel.detail = detail
        viewModel.photos = (0..<photoCount).map {
            ReportPhoto(objectKey: "preview-\($0)", image: previewImage)
        }
        viewModel.isSubmitting = isSubmitting
        return viewModel
    }

    private static let previewImage = UIGraphicsImageRenderer(size: CGSize(width: 600, height: 600))
        .image { context in
            UIColor.systemGray3.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 600, height: 600))
        }
}
