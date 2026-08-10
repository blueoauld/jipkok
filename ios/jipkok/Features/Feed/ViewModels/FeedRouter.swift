enum FeedRoute: Hashable {
    
    case memberDetail(id: Int)
    case myProfile
}

typealias FeedRouter = Router<FeedRoute>
