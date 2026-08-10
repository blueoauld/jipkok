import Foundation

struct MemberDetail: Identifiable, Hashable {
    let id: Int
    let nickname: String
    let gender: Member.Gender
    let age: Int
    let receivedLikeCount: Int
    let comment: String?
    let bio: String?
    let locatedAt: Date?
    let distanceInMeters: Double?
    let isLiked: Bool
    let isFavorited: Bool
    let isNoteReceiveEnabled: Bool
    let isSecretPhotoGrantedToMe: Bool
    let isSecretPhotoGrantedByMe: Bool
    let isBlocked: Bool
    let secretPhotoCount: Int
    let publicPhotoURLs: [URL]
}

extension MemberDetail {

    static let preview = MemberDetail(
        id: 1,
        nickname: "달리는고양이",
        gender: .female,
        age: 27,
        receivedLikeCount: 128,
        comment: "오늘 저녁에 같이 러닝하실 분 구해요",
        bio: "퇴근하고 한강에서 자주 뜁니다. 페이스는 6분대라 편하게 같이 뛰실 분이면 좋겠어요.",
        locatedAt: Date(timeIntervalSinceNow: -180),
        distanceInMeters: 1_240,
        isLiked: true,
        isFavorited: false,
        isNoteReceiveEnabled: true,
        isSecretPhotoGrantedToMe: false,
        isSecretPhotoGrantedByMe: false,
        isBlocked: false,
        secretPhotoCount: 3,
        publicPhotoURLs: []
    )
}
