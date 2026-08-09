enum GenderFilter: CaseIterable {
    case all
    case male
    case female
    
    var label: String {
        switch self {
        case .all: "전체"
        case .male: "남자"
        case .female: "여자"
        }
    }
}
