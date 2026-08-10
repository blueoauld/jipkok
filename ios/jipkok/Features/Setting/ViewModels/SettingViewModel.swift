import Observation

@Observable
@MainActor
final class SettingViewModel {

    var isConfirmingSignout = false

    private(set) var isSigningOut = false

    private let session: AuthSession
    private let tokenStore: TokenStore
    private let client: Client

    init(
        session: AuthSession,
        tokenStore: TokenStore = TokenStore(),
        client: Client = APIClient.authenticated()
    ) {
        self.session = session
        self.tokenStore = tokenStore
        self.client = client
    }

    func signout() async {
        guard !isSigningOut else { return }

        isSigningOut = true

        defer { isSigningOut = false }

        if let refreshToken = tokenStore.refreshToken {
            _ = try? await client.logout(.init(body: .json(.init(refreshToken: refreshToken))))
        }

        session.signout()
    }
}
