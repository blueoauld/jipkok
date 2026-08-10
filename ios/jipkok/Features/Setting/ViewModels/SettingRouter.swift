enum SettingRoute: Hashable {
    
    case activity(ActivityKind)
    case memberDetail(id: Int)
    case pointHistory
    case myProfile
    case editProfile
}

typealias SettingRouter = Router<SettingRoute>
