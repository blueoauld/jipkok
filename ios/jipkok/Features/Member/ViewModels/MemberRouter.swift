enum MemberRoute: Hashable {
    
    case search
    case memberDetail(id: Int)
}

typealias MemberRouter = Router<MemberRoute>
