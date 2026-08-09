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
    let locatedAt: Date
    let distanceInMeters: Double?
    let isFavorited: Bool
}

private let nicknamePrefixes = [
    "달리는", "졸린", "책읽는", "산책하는", "노래하는",
    "요리하는", "여행가는", "사진찍는", "춤추는", "코딩하는"
]

private let nicknameSuffixes = [
    "고양이", "너구리", "판다", "여우", "펭귄",
    "수달", "다람쥐", "부엉이", "하마", "돌고래"
]

private let sampleComments = [
    "오늘 저녁에 같이 러닝하실 분 구해요",
    "퇴근하고 한잔",
    "커피 좋아하는 사람이면 누구든 환영입니다. 주말에는 보통 카페에 있어요.",
    "주말에 등산 같이 가요",
    "심야 드라이브 좋아합니다",
    "동네 친구 찾습니다",
    "요즘 클라이밍 배우는 중",
    "맛집 탐방 같이 하실 분"
]

extension Member {
    
    static let samples: [Member] = (0..<100).map { index in
        let nickname = nicknamePrefixes[index / 10] + nicknameSuffixes[index % 10]
        
        return Member(
            id: index + 1,
            nickname: index.isMultiple(of: 13) ? nickname + "입니다반가워요" : nickname,
            gender: index.isMultiple(of: 2) ? .female : .male,
            age: 19 + index % 40,
            receivedLikeCount: index * 37 % 500,
            comment: index.isMultiple(of: 7) ? nil : sampleComments[index % sampleComments.count],
            profileImageURL: nil,
            locatedAt: Date(timeIntervalSinceNow: -Double(index * 137 + 20)),
            distanceInMeters: index.isMultiple(of: 5) ? nil : Double(index * 431 % 30_000 + 80),
            isFavorited: index.isMultiple(of: 6)
        )
    }
}
