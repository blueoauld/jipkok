import Foundation

struct PointHistory: Identifiable {

    enum Kind {
        case accessReward
        case attendanceReward
        case adReward
        case noteSend

        var label: String {
            switch self {
            case .accessReward: "접속 보상"
            case .attendanceReward: "출석 보상"
            case .adReward: "광고 보상"
            case .noteSend: "쪽지 전송"
            }
        }
    }

    let id: Int
    let kind: Kind
    let amount: Int
    let recordedAt: Date
}

extension PointHistory {

    static let previews: [PointHistory] = [
        PointHistory(id: 1, kind: .attendanceReward, amount: 100, recordedAt: Date()),
        PointHistory(id: 2, kind: .adReward, amount: 300, recordedAt: Date().addingTimeInterval(-3_600)),
        PointHistory(id: 3, kind: .noteSend, amount: -500, recordedAt: Date().addingTimeInterval(-86_400)),
        PointHistory(id: 4, kind: .accessReward, amount: 50, recordedAt: Date().addingTimeInterval(-172_800)),
    ]
}
