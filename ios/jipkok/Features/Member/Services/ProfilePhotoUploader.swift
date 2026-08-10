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

    private let client: Client

    init(client: Client = APIClient.authenticated()) {
        self.client = client
    }

    func upload(_ image: UIImage, visibility: PhotoVisibility) async throws -> String {
        guard let data = PhotoUpload.jpegData(from: image) else {
            throw PhotoUpload.failed
        }

        let issued = try await client.createMemberPhotoUploadUrl(
            .init(body: .json(.init(contentType: PhotoUpload.contentType, visibility: visibility.payload)))
        ).ok.body.json

        try await PhotoUpload.put(data, to: issued.uploadUrl)

        return issued.objectKey
    }
}
