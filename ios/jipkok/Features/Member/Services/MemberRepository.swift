import Foundation

struct MemberPage {
    
    let members: [Member]
    let nextCursor: String?
}

struct MemberRepository {
    
    private let client: Client
    
    init(client: Client = APIClient.authenticated()) {
        self.client = client
    }
    
    func findMembers(
        sort: MemberSort,
        gender: GenderFilter,
        cursor: String?
    ) async throws -> MemberPage {
        let output = try await client.findMembers(
            .init(query: .init(sort: sort.payload, gender: gender.payload, cursor: cursor))
        )
        let page = try output.ok.body.json
        
        return MemberPage(members: page.items.map(Member.init), nextCursor: page.nextCursor)
    }
    
    func updateComment(_ comment: String?) async throws {
        _ = try await client.updateComment(.init(body: .json(.init(comment: comment))))
    }
}

private extension Member {
    
    init(_ response: Components.Schemas.MemberListItemResponse) {
        self.init(
            id: Int(response.memberId),
            nickname: response.nickname,
            gender: response.gender == .male ? .male : .female,
            age: Int(response.age),
            receivedLikeCount: Int(response.receivedLikeCount),
            comment: response.comment,
            profileImageURL: response.profileImageUrl.flatMap(URL.init(string:)),
            locatedAt: response.locatedAt,
            distanceInMeters: response.distance,
            isFavorited: response.favoritedByMe
        )
    }
}

private extension MemberSort {
    
    var payload: Operations.FindMembers.Input.Query.SortPayload {
        switch self {
        case .recent: .recent
        case .distance: .distance
        }
    }
}

private extension GenderFilter {
    
    var payload: Operations.FindMembers.Input.Query.GenderPayload? {
        switch self {
        case .all: nil
        case .male: .male
        case .female: .female
        }
    }
}
