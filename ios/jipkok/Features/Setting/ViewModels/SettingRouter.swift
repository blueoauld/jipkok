enum SettingRoute: Hashable {
    
    case activity(ActivityKind)
    case memberDetail(id: Int)
    case pointHistory
    case myProfile
}

typealias SettingRouter = Router<SettingRoute>
