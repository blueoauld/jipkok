import Foundation

struct FeedPost: Identifiable, Hashable {
    let id: Int
    let memberId: Int
    let nickname: String
    let profileImageURL: URL?
    let imageURL: URL?
    let caption: String?
    let slotAt: Date
    let isLiked: Bool
}

private let sampleCaptions: [String?] = [
    "퇴근길 노을",
    nil,
    "오늘의 커피",
    "야근 확정",
    nil,
    "동네 산책 중",
    "주말 아침",
    nil
]

private let sampleNicknames = [
    "달리는고양이", "졸린너구리", "책읽는판다", "산책하는여우", "노래하는펭귄",
    "요리하는수달", "여행가는다람쥐", "사진찍는부엉이"
]

extension FeedPost {
    
    static let samples: [FeedPost] = sampleNicknames.enumerated().map { index, nickname in
        FeedPost(
            id: index + 1,
            memberId: index + 1,
            nickname: nickname,
            profileImageURL: nil,
            imageURL: nil,
            caption: sampleCaptions[index % sampleCaptions.count],
            slotAt: Date(timeIntervalSinceNow: -Double(index * 5_400 + 600)),
            isLiked: index.isMultiple(of: 3)
        )
    }
}
