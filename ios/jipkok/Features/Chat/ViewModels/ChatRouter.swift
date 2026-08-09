import Observation

enum ChatRoute: Hashable {
    case search
}

@Observable
final class ChatRouter {

    var path: [ChatRoute] = []

    func push(_ route: ChatRoute) {
        path.append(route)
    }

    func popToRoot() {
        path.removeAll()
    }
}
