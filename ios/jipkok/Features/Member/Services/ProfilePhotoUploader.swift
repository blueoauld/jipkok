import UIKit

enum PhotoVisibility {

    case `public`
    case secret

    var payload: Components.Schemas.CreatePhotoUploadUrlRequest.VisibilityPayload {
        switch self {
        case .public: ._public
        case .secret: .secret
        }
    }
}

struct ProfilePhotoUploader {

    private static let contentType = "image/jpeg"
    private static let maxPixelLength: CGFloat = 1440
    private static let compressionQuality: CGFloat = 0.8

    private let client: Client

    init(client: Client = APIClient.authenticated()) {
        self.client = client
    }

    func upload(_ image: UIImage, visibility: PhotoVisibility) async throws -> String {
        guard let data = jpegData(from: image) else {
            throw Self.uploadFailed
        }

        let issued = try await client.createMemberPhotoUploadUrl(
            .init(body: .json(.init(contentType: Self.contentType, visibility: visibility.payload)))
        ).ok.body.json

        guard let url = URL(string: issued.uploadUrl) else {
            throw Self.uploadFailed
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue(Self.contentType, forHTTPHeaderField: "Content-Type")

        let (_, response) = try await URLSession.shared.upload(for: request, from: data)

        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw Self.uploadFailed
        }

        return issued.objectKey
    }

    private func jpegData(from image: UIImage) -> Data? {
        let pixelSize = CGSize(width: image.size.width * image.scale, height: image.size.height * image.scale)
        let longest = max(pixelSize.width, pixelSize.height)
        let ratio = min(1, Self.maxPixelLength / longest)
        let targetSize = CGSize(width: pixelSize.width * ratio, height: pixelSize.height * ratio)

        let format = UIGraphicsImageRendererFormat()
        format.scale = 1

        let resized = UIGraphicsImageRenderer(size: targetSize, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }

        return resized.jpegData(compressionQuality: Self.compressionQuality)
    }

    private static let uploadFailed = APIError(
        status: 0,
        code: "PHOTO_UPLOAD_FAILED",
        message: "사진을 업로드하지 못했습니다."
    )
}
