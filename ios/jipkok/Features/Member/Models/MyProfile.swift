import Foundation

struct ProfilePhoto: Hashable {
    
    let objectKey: String
    let url: URL
}

struct MyProfile {
    
    let id: Int
    let nickname: String
    let gender: Member.Gender
    let birthYear: Int
    let age: Int
    let receivedLikeCount: Int
    let comment: String?
    let bio: String?
    let publicPhotos: [ProfilePhoto]
    let secretPhotos: [ProfilePhoto]
    
    var allPhotoURLs: [URL] {
        (publicPhotos + secretPhotos).map(\.url)
    }
    
    func isSecretPhoto(at index: Int) -> Bool {
        (publicPhotos.count..<publicPhotos.count + secretPhotos.count).contains(index)
    }
}

extension MyProfile {
    
    static let preview = MyProfile(
        id: 1,
        nickname: "달리는고양이",
        gender: .female,
        birthYear: 2000,
        age: 27,
        receivedLikeCount: 128,
        comment: "오늘 저녁에 같이 러닝하실 분 구해요",
        bio: "안녕하세요. 주말마다 한강에서 러닝하고 있습니다. 같이 뛰실 분은 편하게 연락 주세요.",
        publicPhotos: [],
        secretPhotos: []
    )
    
    static let previewEmpty = MyProfile(
        id: 2,
        nickname: "졸린너구리",
        gender: .male,
        birthYear: 1993,
        age: 34,
        receivedLikeCount: 7,
        comment: nil,
        bio: nil,
        publicPhotos: [],
        secretPhotos: []
    )
}
