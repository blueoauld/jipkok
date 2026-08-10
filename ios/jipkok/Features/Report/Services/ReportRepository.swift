import UIKit

struct ReportRepository {

    private let client: Client

    init(client: Client = APIClient.authenticated()) {
        self.client = client
    }

    func uploadPhoto(_ image: UIImage) async throws -> String {
        guard let data = PhotoUpload.jpegData(from: image) else {
            throw PhotoUpload.failed
        }

        let issued = try await client.createPhotoUploadUrl(
            .init(body: .json(.init(contentType: PhotoUpload.contentType)))
        ).ok.body.json

        try await PhotoUpload.put(data, to: issued.uploadUrl)

        return issued.objectKey
    }

    func createReport(
        memberId: Int,
        roomId: Int?,
        reason: ReportReason,
        detail: String?,
        photoKeys: [String]
    ) async throws {
        _ = try await client.report(
            .init(
                body: .json(
                    .init(
                        reportedMemberId: Int64(memberId),
                        roomId: roomId.map(Int64.init),
                        reason: reason.payload,
                        detail: detail,
                        photoKeys: photoKeys
                    )
                )
            )
        )
    }
}

private extension ReportReason {

    var payload: Components.Schemas.CreateReportRequest.ReasonPayload {
        switch self {
        case .obscenity: .obscenity
        case .minor: .minor
        case .moneyTransaction: .moneyTransaction
        case .abuse: .abuse
        case .impersonation: .impersonation
        case .etc: .etc
        }
    }
}
