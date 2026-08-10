import Foundation

struct ActivityItem: Identifiable {

    let member: Member
    let viewedAt: Date?

    var id: Int { member.id }
}

struct ActivityPage {

    let items: [ActivityItem]
    let nextCursor: String?
}

struct ActivityRepository {

    private let client: Client

    init(client: Client = APIClient.authenticated()) {
        self.client = client
    }

    func findItems(kind: ActivityKind, cursor: String?) async throws -> ActivityPage {
        switch kind {
        case .like:
            page(try await client.findLiked(.init(query: .init(cursor: cursor.flatMap(Int64.init)))).ok.body.json)
        case .favorite:
            page(try await client.findFavorites(.init(query: .init(cursor: cursor.flatMap(Int64.init)))).ok.body.json)
        case .secretPhoto:
            page(try await client.findGrantedSecretPhotos(.init(query: .init(cursor: cursor.flatMap(Int64.init)))).ok.body.json)
        case .block:
            page(try await client.findBlocked(.init(query: .init(cursor: cursor.flatMap(Int64.init)))).ok.body.json)
        case .receivedLike:
            page(try await client.findReceivedLikes(.init(query: .init(cursor: cursor.flatMap(Int64.init)))).ok.body.json)
        case .receivedFavorite:
            page(try await client.findReceivedFavorites(.init(query: .init(cursor: cursor.flatMap(Int64.init)))).ok.body.json)
        case .openedSecretPhoto:
            page(try await client.findReceivedSecretPhotos(.init(query: .init(cursor: cursor.flatMap(Int64.init)))).ok.body.json)
        case .profileView:
            viewerPage(try await client.findViewers(.init(query: .init(cursor: cursor))).ok.body.json)
        }
    }

    func remove(kind: ActivityKind, memberId: Int) async throws {
        let id = Int64(memberId)

        switch kind {
        case .like:
            _ = try await client.cancelMemberLike(.init(path: .init(memberId: id)))
        case .favorite:
            _ = try await client.removeFavorite(.init(path: .init(memberId: id)))
        case .secretPhoto:
            _ = try await client.revokeSecretPhoto(.init(path: .init(memberId: id)))
        case .block:
            _ = try await client.unblock(.init(path: .init(memberId: id)))
        case .receivedLike, .receivedFavorite, .openedSecretPhoto, .profileView:
            return
        }
    }

    func markProfileViewsSeen() async throws {
        _ = try await client.markSeen(.init())
    }

    private func page(_ response: Components.Schemas.CursorResponseMemberSummaryResponse) -> ActivityPage {
        ActivityPage(
            items: response.items.map { ActivityItem(member: Member($0), viewedAt: nil) },
            nextCursor: response.nextCursor.map(String.init)
        )
    }

    private func viewerPage(_ response: Components.Schemas.ScrollResponseProfileViewResponse) -> ActivityPage {
        ActivityPage(
            items: response.items.map { ActivityItem(member: Member($0.member), viewedAt: $0.viewedAt) },
            nextCursor: response.nextCursor
        )
    }
}
