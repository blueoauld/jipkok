import Foundation

struct ChatRoomPage {
    
    let rooms: [ChatRoom]
    let nextCursor: Int64?
}

struct ChatRepository {
    
    private let client: Client
    
    init(client: Client = APIClient.authenticated()) {
        self.client = client
    }
    
    func findRooms(unreadOnly: Bool, cursor: Int64?) async throws -> ChatRoomPage {
        let output = try await client.findRooms(
            .init(query: .init(unreadOnly: unreadOnly, cursor: cursor))
        )
        let page = try output.ok.body.json
        
        return ChatRoomPage(rooms: page.items.map(ChatRoom.init), nextCursor: page.nextCursor)
    }
    
    func searchRooms(keyword: String, cursor: Int64?) async throws -> ChatRoomPage {
        let output = try await client.searchRooms(
            .init(query: .init(keyword: keyword, cursor: cursor))
        )
        let page = try output.ok.body.json
        
        return ChatRoomPage(rooms: page.items.map(ChatRoom.init), nextCursor: page.nextCursor)
    }
    
    func setNotificationEnabled(_ enabled: Bool, roomId: Int) async throws {
        _ = try await client.updateNotification(
            .init(path: .init(roomId: Int64(roomId)), body: .json(.init(enabled: enabled)))
        )
    }
    
    func leave(roomId: Int) async throws {
        _ = try await client.leave(.init(path: .init(roomId: Int64(roomId))))
    }
    
    func setNoteReceiveEnabled(_ enabled: Bool) async throws {
        _ = try await client.updateNoteReceive(.init(body: .json(.init(enabled: enabled))))
    }
    
    func findNoteReceiveEnabled() async throws -> Bool {
        try await client.getMyProfile(.init()).ok.body.json.noteReceiveEnabled
    }
}

private extension ChatRoom {
    
    init(_ response: Components.Schemas.ChatRoomResponse) {
        let lastMessage: LastMessage = switch response.lastMessageType {
        case .text: .text(response.lastMessageContent ?? "")
        case .photo: .photo
        }
        
        self.init(
            id: Int(response.roomId),
            memberId: Int(response.memberId),
            nickname: response.nickname,
            profileImageURL: response.profileImageUrl.flatMap(URL.init(string:)),
            lastMessage: lastMessage,
            lastMessageAt: response.lastMessageAt,
            unreadCount: Int(response.unreadCount),
            isNotificationEnabled: response.notificationEnabled
        )
    }
}
