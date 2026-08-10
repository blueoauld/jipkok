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
    
    func searchMembers(keyword: String, cursor: String?) async throws -> MemberPage {
        let output = try await client.searchByNickname(.init(query: .init(keyword: keyword, cursor: cursor)))
        let page = try output.ok.body.json
        
        return MemberPage(members: page.items.map(Member.init), nextCursor: page.nextCursor)
    }
    
    func findRanking(gender: GenderFilter, cursor: String?) async throws -> MemberPage {
        let output = try await client.findRanking(.init(query: .init(gender: gender.rankingPayload, cursor: cursor)))
        let page = try output.ok.body.json
        
        return MemberPage(members: page.items.map(Member.init), nextCursor: page.nextCursor)
    }
    
    func findDetail(id: Int) async throws -> MemberDetail {
        let output = try await client.findDetail(.init(path: .init(targetId: Int64(id))))
        
        return MemberDetail(try output.ok.body.json)
    }
    
    func setLiked(_ isLiked: Bool, id: Int) async throws {
        if isLiked {
            _ = try await client.likeMember(.init(path: .init(memberId: Int64(id))))
        } else {
            _ = try await client.cancelMemberLike(.init(path: .init(memberId: Int64(id))))
        }
    }
    
    func setFavorited(_ isFavorited: Bool, id: Int) async throws {
        if isFavorited {
            _ = try await client.addFavorite(.init(path: .init(memberId: Int64(id))))
        } else {
            _ = try await client.removeFavorite(.init(path: .init(memberId: Int64(id))))
        }
    }
    
    func setSecretPhotoGranted(_ isGranted: Bool, id: Int) async throws {
        if isGranted {
            _ = try await client.grantSecretPhoto(.init(path: .init(memberId: Int64(id))))
        } else {
            _ = try await client.revokeSecretPhoto(.init(path: .init(memberId: Int64(id))))
        }
    }
    
    func setBlocked(_ isBlocked: Bool, id: Int) async throws {
        if isBlocked {
            _ = try await client.block(.init(path: .init(memberId: Int64(id))))
        } else {
            _ = try await client.unblock(.init(path: .init(memberId: Int64(id))))
        }
    }
    
    func findSecretPhotoURLs(id: Int) async throws -> [URL] {
        let output = try await client.findPhotoUrls(.init(path: .init(memberId: Int64(id))))

        return try output.ok.body.json.compactMap(URL.init(string:))
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

private extension Member {
    
    init(_ response: Components.Schemas.MemberSummaryResponse) {
        self.init(
            id: Int(response.memberId),
            nickname: response.nickname,
            gender: response.gender == .male ? .male : .female,
            age: Int(response.age),
            receivedLikeCount: Int(response.receivedLikeCount),
            comment: response.comment,
            profileImageURL: response.profileImageUrl.flatMap(URL.init(string:)),
            locatedAt: nil,
            distanceInMeters: nil,
            isFavorited: false
        )
    }
}

private extension MemberDetail {
    
    init(_ response: Components.Schemas.MemberDetailResponse) {
        self.init(
            id: Int(response.memberId),
            nickname: response.nickname,
            gender: response.gender == .male ? .male : .female,
            age: Int(response.age),
            receivedLikeCount: Int(response.receivedLikeCount),
            comment: response.comment,
            bio: response.bio,
            locatedAt: response.locatedAt,
            distanceInMeters: response.distance,
            isLiked: response.likedByMe,
            isFavorited: response.favoritedByMe,
            isNoteReceiveEnabled: response.noteReceiveEnabled,
            isSecretPhotoGrantedToMe: response.secretPhotoGrantedToMe,
            isSecretPhotoGrantedByMe: response.secretPhotoGrantedByMe,
            isBlocked: response.blockedByMe,
            secretPhotoCount: Int(response.secretPhotoCount),
            publicPhotoURLs: response.publicPhotoUrls.compactMap(URL.init(string:))
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
    
    var rankingPayload: Operations.FindRanking.Input.Query.GenderPayload? {
        switch self {
        case .all: nil
        case .male: .male
        case .female: .female
        }
    }
}
