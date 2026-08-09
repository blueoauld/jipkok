import Foundation

struct ChatRoom: Identifiable, Hashable {

    enum LastMessage: Hashable {
        case text(String)
        case photo

        var preview: String {
            switch self {
            case .text(let content): content
            case .photo: "사진"
            }
        }
    }

    let id: Int
    let nickname: String
    let profileImageURL: URL?
    let lastMessage: LastMessage
    let lastMessageAt: Date
    let unreadCount: Int
    let isNotificationEnabled: Bool
}

private let sampleMessages: [ChatRoom.LastMessage] = [
    .text("내일 시간 괜찮으세요? 내일 시간 괜찮으세요? 내일 시간 괜찮으세요? 내일 시간 괜찮으세요? 내일 시간 괜찮으세요? 내일 시간 괜찮으세요?"),
    .text("네 좋아요 내일 시간 괜찮으세요? 내일 시간 괜찮으세요? 내일 시간 괜찮으세요? 내일 시간 괜찮으세요? 내일 시간 괜찮으세요? 내일 시간 괜찮으세요?"),
    .photo,
    .text("오늘 하루도 고생 많으셨어요. 내일 봬요."),
    .text("ㅋㅋㅋㅋ"),
    .text("그 카페 어디예요?"),
    .photo,
    .text("지금 출발합니다")
]

private let sampleUnreadCounts = [0, 3, 0, 0, 12, 0, 1, 0, 128, 0, 7, 0]

private let sampleNicknames = [
    "달리는고양이", "졸린너구리", "책읽는판다", "산책하는여우", "노래하는펭귄",
    "요리하는수달", "여행가는다람쥐", "사진찍는부엉이", "춤추는하마", "코딩하는돌고래",
    "밤샘하는올빼미", "조용한물개"
]

extension ChatRoom {

    static let samples: [ChatRoom] = sampleNicknames.enumerated().map { index, nickname in
        ChatRoom(
            id: index + 1,
            nickname: nickname,
            profileImageURL: nil,
            lastMessage: sampleMessages[index % sampleMessages.count],
            lastMessageAt: Date(timeIntervalSinceNow: -Double(index * 7_300 + 60)),
            unreadCount: sampleUnreadCounts[index % sampleUnreadCounts.count],
            isNotificationEnabled: !index.isMultiple(of: 5)
        )
    }
}
