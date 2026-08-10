enum ActivityKind: Hashable {
    
    case like
    case favorite
    case secretPhoto
    case block
    case receivedLike
    case receivedFavorite
    case openedSecretPhoto
    case profileView
    
    var title: String {
        switch self {
        case .like: "좋아요 목록"
        case .favorite: "즐겨찾기 목록"
        case .secretPhoto: "비밀 사진 목록"
        case .block: "차단 목록"
        case .receivedLike: "받은 좋아요 목록"
        case .receivedFavorite: "받은 즐겨찾기 목록"
        case .openedSecretPhoto: "공개된 비밀 사진 목록"
        case .profileView: "내 프로필 조회 목록"
        }
    }
    
    var isDeletable: Bool {
        switch self {
        case .like, .favorite, .secretPhoto, .block: true
        case .receivedLike, .receivedFavorite, .openedSecretPhoto, .profileView: false
        }
    }
    
    var requiresAd: Bool {
        switch self {
        case .like, .favorite, .secretPhoto, .block: false
        case .receivedLike, .receivedFavorite, .openedSecretPhoto, .profileView: true
        }
    }
}
