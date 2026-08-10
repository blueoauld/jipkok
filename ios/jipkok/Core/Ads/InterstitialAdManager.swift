import GoogleMobileAds
import UIKit

@MainActor
final class InterstitialAdManager: NSObject {

    #if DEBUG
    private static let adUnitID = "ca-app-pub-3940256099942544/4411468910"
    #else
    private static let adUnitID = "ca-app-pub-5005991782528987/5548384263"
    #endif

    private var ad: InterstitialAd?
    private var isLoading = false
    private var presentation: CheckedContinuation<Void, Never>?

    func show() async {
        await MobileAds.shared.start()
        await loadIfNeeded()

        guard let ad else { return }

        ad.fullScreenContentDelegate = self
        self.ad = nil

        await withCheckedContinuation { continuation in
            presentation = continuation
            ad.present(from: rootViewController)
        }
    }

    private func finishPresentation() {
        presentation?.resume()
        presentation = nil
    }

    private func loadIfNeeded() async {
        guard ad == nil, !isLoading else { return }

        isLoading = true

        defer { isLoading = false }

        ad = try? await InterstitialAd.load(with: Self.adUnitID, request: Request())
    }

    private var rootViewController: UIViewController? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController
    }
}

extension InterstitialAdManager: FullScreenContentDelegate {

    nonisolated func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        Task { @MainActor in
            finishPresentation()
        }
    }

    nonisolated func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        Task { @MainActor in
            finishPresentation()

            await loadIfNeeded()
        }
    }
}
