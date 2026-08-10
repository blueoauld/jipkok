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
}
