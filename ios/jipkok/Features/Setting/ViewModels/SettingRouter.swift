enum SettingRoute: Hashable {
    
    case activity(ActivityKind)
    case memberDetail(id: Int)
    case pointHistory
}

typealias SettingRouter = Router<SettingRoute>
