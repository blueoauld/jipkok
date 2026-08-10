import Foundation

struct Member: Identifiable, Hashable {

    enum Gender: Hashable {
        case male
        case female

        var label: String {
            switch self {
            case .male: "남자"
            case .female: "여자"
            }
        }
    }

    let id: Int
    let nickname: String
    let gender: Gender
    let age: Int
    let receivedLikeCount: Int
    let comment: String?
    let profileImageURL: URL?
    let locatedAt: Date?
    let distanceInMeters: Double?
    let isFavorited: Bool
}

extension Member {

    static let previews: [Member] = [
        Member(
            id: 1,
            nickname: "달리는고양이",
            gender: .female,
            age: 27,
            receivedLikeCount: 128,
            comment: "오늘 저녁에 같이 러닝하실 분 구해요",
            profileImageURL: nil,
            locatedAt: Date(timeIntervalSinceNow: -30),
            distanceInMeters: 1_240,
            isFavorited: true
        ),
        Member(
            id: 2,
            nickname: "산책하는고양이입니다반가워요",
            gender: .male,
            age: 34,
            receivedLikeCount: 7,
            comment: nil,
            profileImageURL: nil,
            locatedAt: nil,
            distanceInMeters: nil,
            isFavorited: false
        ),
        Member(
            id: 3,
            nickname: "졸린너구리",
            gender: .female,
            age: 41,
            receivedLikeCount: 302,
            comment: "커피 좋아하는 사람이면 누구든 환영입니다. 주말에는 보통 카페에 있어요.",
            profileImageURL: nil,
            locatedAt: Date(timeIntervalSinceNow: -60 * 60 * 5),
            distanceInMeters: 8_600,
            isFavorited: false
        )
    ]
}
