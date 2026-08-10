import Observation

private let phoneNumberLength = 11

@Observable
@MainActor
final class LoginViewModel {

    var phoneNumber = ""
    var password = ""
    var errorMessage: String?

    private(set) var isSubmitting = false

    var canSubmit: Bool {
        !phoneNumber.isEmpty && !password.isEmpty && !isSubmitting
    }

    var isShowingError: Bool {
        get { errorMessage != nil }
        set { if !newValue { errorMessage = nil } }
    }

    private let client: Client
    private let session: AuthSession

    init(session: AuthSession, client: Client = APIClient.make()) {
        self.session = session
        self.client = client
    }

    func sanitizePhoneNumber() {
        phoneNumber = String(phoneNumber.filter(\.isNumber).prefix(phoneNumberLength))
    }

    func submit() async {
        guard canSubmit else { return }

        isSubmitting = true

        defer { isSubmitting = false }

        do {
            let output = try await client.login(
                .init(body: .json(.init(phoneNumber: phoneNumber, password: password)))
            )
            let tokens = try output.ok.body.json

            try session.signin(accessToken: tokens.accessToken, refreshToken: tokens.refreshToken)
        } catch {
            errorMessage = APIError.from(error).message
        }
    }
}
