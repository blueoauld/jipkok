import Foundation
import UIKit

struct FeedPage {
    
    let posts: [FeedPost]
    let nextCursor: Int64?
}

struct FeedRepository {
    
    private let client: Client
    
    init(client: Client = APIClient.authenticated()) {
        self.client = client
    }
    
    func findPosts(sort: FeedSort, gender: GenderFilter, date: Date, cursor: Int64?) async throws -> FeedPage {
        let output = try await client.findByDate(
            .init(
                query: .init(
                    gender: gender.feedPayload,
                    sort: sort.payload,
                    date: date.formatted(
                        Date.ISO8601FormatStyle(timeZone: .current).year().month().day().dateSeparator(.dash)
                    ),
                    cursor: cursor
                )
            )
        )
        let page = try output.ok.body.json
        
        return FeedPage(posts: page.items.compactMap(FeedPost.init), nextCursor: page.nextCursor)
    }
    
    func setLiked(_ isLiked: Bool, postId: Int) async throws {
        if isLiked {
            _ = try await client.likeFeedPost(.init(path: .init(postId: Int64(postId))))
        } else {
            _ = try await client.cancelLike(.init(path: .init(postId: Int64(postId))))
        }
    }
    
    func report(postId: Int) async throws {
        _ = try await client.reportFeedPost(.init(path: .init(postId: Int64(postId))))
    }
    
    func updateNotification(enabled: Bool) async throws {
        _ = try await client.updateFeedNotification(.init(body: .json(.init(enabled: enabled))))
    }
    
    func uploadPhoto(_ image: UIImage) async throws -> String {
        guard let data = PhotoUpload.jpegData(from: image) else {
            throw PhotoUpload.failed
        }
        
        let issued = try await client.createFeedPhotoUploadUrl(
            .init(body: .json(.init(contentType: PhotoUpload.contentType)))
        ).ok.body.json
        
        try await PhotoUpload.put(data, to: issued.uploadUrl)
        
        return issued.objectKey
    }
    
    func createPost(objectKey: String, caption: String?) async throws {
        _ = try await client.createFeedPost(
            .init(body: .json(.init(objectKey: objectKey, caption: caption)))
        )
    }
    
    func findMyInfo() async throws -> (memberId: Int, notificationEnabled: Bool) {
        let profile = try await client.getMyProfile(.init()).ok.body.json
        
        return (Int(profile.memberId), profile.feedNotificationEnabled)
    }
}

private extension FeedPost {
    
    init?(_ response: Components.Schemas.FeedPostResponse) {
        guard let imageURL = URL(string: response.imageUrl) else { return nil }
        
        self.init(
            id: Int(response.postId),
            memberId: Int(response.memberId),
            nickname: response.nickname,
            profileImageURL: response.profileImageUrl.flatMap(URL.init(string:)),
            imageURL: imageURL,
            caption: response.caption,
            slotAt: response.slotAt,
            isLiked: response.likedByMe
        )
    }
}

private extension FeedSort {
    
    var payload: Operations.FindByDate.Input.Query.SortPayload {
        switch self {
        case .latest: .latest
        case .oldest: .oldest
        }
    }
}

private extension GenderFilter {
    
    var feedPayload: Operations.FindByDate.Input.Query.GenderPayload? {
        switch self {
        case .all: nil
        case .male: .male
        case .female: .female
        }
    }
}
