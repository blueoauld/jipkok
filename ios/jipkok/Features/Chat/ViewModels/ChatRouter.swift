enum ChatRoute: Hashable {

    case search
    case room(ChatRoom)
}

typealias ChatRouter = Router
