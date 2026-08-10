import UIKit

enum PhotoUpload {

    static let contentType = "image/jpeg"

    private static let maxPixelLength: CGFloat = 1440
    private static let compressionQuality: CGFloat = 0.8

    static let failed = APIError(
        status: 0,
        code: "PHOTO_UPLOAD_FAILED",
        message: "사진을 업로드하지 못했습니다."
    )

    static func jpegData(from image: UIImage) -> Data? {
        let pixelSize = CGSize(width: image.size.width * image.scale, height: image.size.height * image.scale)
        let longest = max(pixelSize.width, pixelSize.height)
        let ratio = min(1, maxPixelLength / longest)
        let targetSize = CGSize(width: pixelSize.width * ratio, height: pixelSize.height * ratio)

        let format = UIGraphicsImageRendererFormat()
        format.scale = 1

        let resized = UIGraphicsImageRenderer(size: targetSize, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }

        return resized.jpegData(compressionQuality: compressionQuality)
    }

    static func put(_ data: Data, to uploadURL: String) async throws {
        guard let url = URL(string: uploadURL) else {
            throw failed
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")

        let (_, response) = try await URLSession.shared.upload(for: request, from: data)

        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw failed
        }
    }
}
