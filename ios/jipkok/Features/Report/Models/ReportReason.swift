enum ReportReason: CaseIterable, Hashable {

    case obscenity
    case minor
    case moneyTransaction
    case abuse
    case impersonation
    case etc

    var label: String {
        switch self {
        case .obscenity: "음란물"
        case .minor: "미성년자"
        case .moneyTransaction: "금전거래"
        case .abuse: "욕설 및 협박"
        case .impersonation: "사칭 및 도용"
        case .etc: "기타"
        }
    }
}
