enum SettingRoute: Hashable {

    case activity(ActivityKind)
}

typealias SettingRouter = Router<SettingRoute>
