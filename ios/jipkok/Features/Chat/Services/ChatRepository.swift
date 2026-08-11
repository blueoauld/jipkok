import Foundation
import UIKit

struct ChatRoomPage {

    let rooms: [ChatRoom]
    let nextCursor: Int64?
}

struct ChatMessagePage {

    let messages: [ChatMessage]
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

    func findMyMemberId() async throws -> Int {
        Int(try await client.getMyProfile(.init()).ok.body.json.memberId)
    }

    func findMessages(roomId: Int, cursor: Int64?) async throws -> ChatMessagePage {
        let output = try await client.findMessages(
            .init(path: .init(roomId: Int64(roomId)), query: .init(cursor: cursor))
        )
        let page = try output.ok.body.json

        return ChatMessagePage(messages: page.items.compactMap(ChatMessage.init), nextCursor: page.nextCursor)
    }

    func sendTextMessage(_ content: String, roomId: Int) async throws -> ChatMessage {
        try await send(.init(_type: .text, content: content), roomId: roomId)
    }

    func sendPhotoMessage(objectKey: String, roomId: Int) async throws -> ChatMessage {
        try await send(.init(_type: .photo, objectKey: objectKey), roomId: roomId)
    }

    func uploadPhoto(_ image: UIImage) async throws -> String {
        guard let data = PhotoUpload.jpegData(from: image) else {
            throw PhotoUpload.failed
        }

        let issued = try await client.createChatPhotoUploadUrl(
            .init(body: .json(.init(contentType: PhotoUpload.contentType)))
        ).ok.body.json

        try await PhotoUpload.put(data, to: issued.uploadUrl)

        return issued.objectKey
    }

    private func send(_ request: Components.Schemas.SendMessageRequest, roomId: Int) async throws -> ChatMessage {
        let output = try await client.sendChatMessage(
            .init(path: .init(roomId: Int64(roomId)), body: .json(request))
        )

        guard let sent = ChatMessage(try output.created.body.json) else {
            throw APIError.unknown
        }

        return sent
    }
}

extension ChatMessage {

    init?(_ response: Components.Schemas.ChatMessageResponse) {
        let content: Content

        switch response._type {
        case .text:
            guard let text = response.content else { return nil }

            content = .text(text)
        case .photo:
            guard let url = response.imageUrl.flatMap(URL.init(string:)) else { return nil }

            content = .photo(url)
        }

        self.init(
            id: Int(response.messageId),
            roomId: Int(response.roomId),
            senderId: Int(response.senderId),
            content: content,
            createdAt: response.createdAt
        )
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
