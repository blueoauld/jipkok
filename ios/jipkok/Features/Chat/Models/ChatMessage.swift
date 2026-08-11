import Foundation

struct ChatMessage: Identifiable, Hashable {

    enum Content: Hashable {
        case text(String)
        case photo(URL)
    }

    let id: Int
    let roomId: Int
    let senderId: Int
    let content: Content
    let createdAt: Date
}

extension ChatMessage {

    static let previews: [ChatMessage] = [
        ChatMessage(
            id: 1,
            roomId: 1,
            senderId: 1,
            content: .text("안녕하세요! 프로필 보고 연락드려요."),
            createdAt: Date(timeIntervalSinceNow: -3_600)
        ),
        ChatMessage(
            id: 2,
            roomId: 1,
            senderId: 2,
            content: .text("반가워요. 어떤 운동 좋아하세요?"),
            createdAt: Date(timeIntervalSinceNow: -3_500)
        ),
        ChatMessage(
            id: 3,
            roomId: 1,
            senderId: 1,
            content: .text("러닝이요. 주말마다 한강 뛰어요. 같이 뛰실래요?"),
            createdAt: Date(timeIntervalSinceNow: -3_400)
        ),
        ChatMessage(
            id: 4,
            roomId: 1,
            senderId: 2,
            content: .text("좋아요. 이번 주말 어때요?"),
            createdAt: Date(timeIntervalSinceNow: -120)
        ),
    ]
}
