import Foundation

struct MemberDetail: Identifiable, Hashable {
    let id: Int
    let nickname: String
    let gender: Member.Gender
    let age: Int
    let receivedLikeCount: Int
    let comment: String?
    let bio: String?
    let locatedAt: Date
    let distanceInMeters: Double?
    let isLiked: Bool
    let isFavorited: Bool
    let isNoteReceiveEnabled: Bool
    let isSecretPhotoGranted: Bool
    let isBlocked: Bool
    let secretPhotoCount: Int
}

extension MemberDetail {

    static let sample = MemberDetail(
        id: 1,
        nickname: "달리는고양이",
        gender: .female,
        age: 27,
        receivedLikeCount: 128,
        comment: "오늘 저녁에 같이 러닝하실 분 구해요",
        bio: "퇴근하고 한강에서 자주 뜁니다. 페이스는 6분대라 편하게 같이 뛰실 분이면 좋겠어요. 주말에는 보통 카페에서 책 읽습니다.",
        locatedAt: Date(timeIntervalSinceNow: -180),
        distanceInMeters: 1_240,
        isLiked: true,
        isFavorited: false,
        isNoteReceiveEnabled: true,
        isSecretPhotoGranted: false,
        isBlocked: false,
        secretPhotoCount: 3
    )

    static let empty = MemberDetail(
        id: 2,
        nickname: "조용한물개",
        gender: .male,
        age: 34,
        receivedLikeCount: 0,
        comment: nil,
        bio: nil,
        locatedAt: Date(timeIntervalSinceNow: -60 * 60 * 30),
        distanceInMeters: nil,
        isLiked: false,
        isFavorited: false,
        isNoteReceiveEnabled: false,
        isSecretPhotoGranted: false,
        isBlocked: false,
        secretPhotoCount: 0
    )
}
