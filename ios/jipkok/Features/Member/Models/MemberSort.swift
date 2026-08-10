enum MemberSort: String, CaseIterable {
    
    case recent
    case distance
    
    var label: String {
        switch self {
        case .recent: "최근"
        case .distance: "거리"
        }
    }
}
