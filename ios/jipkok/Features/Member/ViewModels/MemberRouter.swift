import Observation

enum MemberRoute: Hashable {
    case search
    case memberDetail(id: Int)
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
