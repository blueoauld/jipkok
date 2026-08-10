import Foundation
import Observation

@Observable
@MainActor
final class SettingViewModel {
    
    var isConfirmingSignout = false
    var message: String?
    
    private(set) var isProcessing = false
    
    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }
    
    private let session: AuthSession
    private let tokenStore: TokenStore
    private let client: Client
    private let pointRepository: PointRepository
    private let adManager: RewardedAdManager
    
    init(
        session: AuthSession,
        tokenStore: TokenStore = TokenStore(),
        client: Client = APIClient.authenticated(),
        pointRepository: PointRepository = PointRepository()
    ) {
        self.session = session
        self.tokenStore = tokenStore
        self.client = client
        self.pointRepository = pointRepository
        self.adManager = RewardedAdManager()
        adManager.onMessage = { [weak self] message in
            self?.message = message
        }
    }
    
    func prepareAds() async {
        await adManager.prepare()
    }
    
    func perform(_ action: SettingMenuItem.Action) async {
        switch action {
        case .attendanceReward: await checkInAttendance()
        case .adReward: await adManager.watch()
        case .contact, .suggest: break
        }
    }
    
    private func checkInAttendance() async {
        guard !isProcessing else { return }
        
        isProcessing = true
        
        defer { isProcessing = false }
        
        do {
            let reward = try await pointRepository.checkInAttendance()
            message = reward.earned
            ? "\(reward.amount.formatted()) 포인트를 받았습니다."
            : "오늘 출석 보상은 이미 받았습니다."
        } catch {
            guard !error.isCancellation else { return }
            
            message = APIError.from(error).message
        }
    }
    
    func signout() async {
        guard !isProcessing else { return }
        
        isProcessing = true
        
        defer { isProcessing = false }
        
        if let refreshToken = tokenStore.refreshToken {
            _ = try? await client.logout(.init(body: .json(.init(refreshToken: refreshToken))))
        }
        
        session.signout()
    }
}

extension SettingViewModel {

    static func preview(isProcessing: Bool = false) -> SettingViewModel {
        let viewModel = SettingViewModel(session: AuthSession())
        viewModel.isProcessing = isProcessing
        return viewModel
    }
}
