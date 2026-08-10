import Foundation

struct PointHistoryPage {
    
    let items: [PointHistory]
    let nextCursor: Int64?
}

struct AttendanceReward {
    
    let earned: Bool
    let amount: Int
}

struct PointRepository {
    
    private let client: Client
    
    init(client: Client = APIClient.authenticated()) {
        self.client = client
    }
    
    func findBalance() async throws -> Int {
        Int(try await client.findBalance(.init()).ok.body.json)
    }
    
    func checkInAttendance() async throws -> AttendanceReward {
        let reward = try await client.checkIn(.init()).ok.body.json
        
        return AttendanceReward(earned: reward.earned, amount: Int(reward.amount))
    }
    
    func findHistories(cursor: Int64?) async throws -> PointHistoryPage {
        let page = try await client.findHistories(.init(query: .init(cursor: cursor))).ok.body.json
        
        return PointHistoryPage(items: page.items.map(PointHistory.init), nextCursor: page.nextCursor)
    }
}

private extension PointHistory {
    
    init(_ response: Components.Schemas.PointHistoryResponse) {
        self.init(
            id: Int(response.historyId),
            kind: PointHistory.Kind(response._type),
            amount: Int(response.amount),
            recordedAt: response.recordedAt
        )
    }
}

private extension PointHistory.Kind {
    
    init(_ payload: Components.Schemas.PointHistoryResponse._TypePayload) {
        self = switch payload {
        case .accessReward: .accessReward
        case .attendanceReward: .attendanceReward
        case .adReward: .adReward
        case .noteSend: .noteSend
        }
    }
}
