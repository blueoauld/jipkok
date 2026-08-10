enum FeedSort: CaseIterable {
    
    case latest
    case oldest
    
    var label: String {
        switch self {
        case .latest: "최근"
        case .oldest: "과거"
        }
    }
}
