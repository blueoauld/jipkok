import Observation

enum MemberRoute: Hashable {
    case search
}

@Observable
final class MemberRouter {
    
    var path: [MemberRoute] = []
    
    func push(_ route: MemberRoute) {
        path.append(route)
    }
    
    func popToRoot() {
        path.removeAll()
    }
}
