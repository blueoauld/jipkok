import Foundation

struct FeedPost: Identifiable, Hashable {
    
    let id: Int
    let memberId: Int
    let nickname: String
    let profileImageURL: URL?
    let imageURL: URL
    let caption: String?
    let slotAt: Date
    var isLiked: Bool
}

extension FeedPost {
    
    static let previews: [FeedPost] = [
        FeedPost(
            id: 1,
            memberId: 1,
            nickname: "달리는고양이",
            profileImageURL: nil,
            imageURL: URL(string: "https://picsum.photos/id/1015/1200/600")!,
            caption: "퇴근길 노을",
            slotAt: Date(timeIntervalSinceNow: -600),
            isLiked: true
        ),
        FeedPost(
            id: 2,
            memberId: 2,
            nickname: "졸린너구리",
            profileImageURL: nil,
            imageURL: URL(string: "https://picsum.photos/id/1025/1200/600")!,
            caption: nil,
            slotAt: Date(timeIntervalSinceNow: -7_200),
            isLiked: false
        ),
    ]
}
