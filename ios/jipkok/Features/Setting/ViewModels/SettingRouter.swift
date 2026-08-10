enum SettingRoute: Hashable {
    
    case activity(ActivityKind)
    case memberDetail(id: Int)
}

typealias SettingRouter = Router<SettingRoute>
