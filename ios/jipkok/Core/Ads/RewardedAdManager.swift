import GoogleMobileAds
import UIKit

@MainActor
final class RewardedAdManager: NSObject {

    #if DEBUG
    private static let adUnitID = "ca-app-pub-3940256099942544/1712485313"
    #else
    private static let adUnitID = "ca-app-pub-5005991782528987/1980106124"
    #endif

    private static let rewardDelay = Duration.seconds(2)

    var onMessage: ((String) -> Void)?

    private let client: Client
    private var ad: RewardedAd?
    private var isLoading = false
    private var memberId: Int?

    init(client: Client = APIClient.authenticated()) {
        self.client = client
    }

    func prepare() async {
        await MobileAds.shared.start()
        await loadIfNeeded()
    }

    func watch() async {
        guard let memberId = await resolveMemberId() else {
            onMessage?(APIError.fallbackMessage)

            return
        }

        guard let ad else {
            onMessage?("광고를 준비하고 있습니다. 잠시 후 다시 시도해주시길 바랍니다.")

            await loadIfNeeded()

            return
        }

        let options = ServerSideVerificationOptions()
        options.userIdentifier = String(memberId)
        ad.serverSideVerificationOptions = options
        ad.fullScreenContentDelegate = self

        ad.present(from: rootViewController) { [weak self] in
            self?.rewardEarned()
        }

        self.ad = nil
    }

    private func rewardEarned() {
        Task {
            try? await Task.sleep(for: Self.rewardDelay)

            onMessage?("광고 보상이 적립되었습니다.")
        }
    }

    private func loadIfNeeded() async {
        guard ad == nil, !isLoading else { return }

        isLoading = true

        defer { isLoading = false }

        ad = try? await RewardedAd.load(with: Self.adUnitID, request: Request())
    }

    private func resolveMemberId() async -> Int? {
        if let memberId {
            return memberId
        }

        let profile = try? await client.getMyProfile(.init()).ok.body.json
        memberId = profile.map { Int($0.memberId) }

        return memberId
    }

    private var rootViewController: UIViewController? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController
    }
}

extension RewardedAdManager: FullScreenContentDelegate {

    nonisolated func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        Task { @MainActor in
            await loadIfNeeded()
        }
    }
}
