import Observation

@Observable
@MainActor
final class LoginViewModel {

    var phoneNumber = ""
    var password = ""
    var errorMessage: String?
    
    private(set) var isSubmitting = false

    var canSubmit: Bool {
        phoneNumber.count == PhoneNumber.length && !password.isEmpty && !isSubmitting
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
        phoneNumber = PhoneNumber.sanitized(phoneNumber)
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
            guard !error.isCancellation else { return }

            errorMessage = APIError.from(error).message
        }
    }
}

extension LoginViewModel {

    static func preview(
        phoneNumber: String = "",
        password: String = "",
        isSubmitting: Bool = false
    ) -> LoginViewModel {
        let viewModel = LoginViewModel(session: AuthSession())
        viewModel.phoneNumber = phoneNumber
        viewModel.password = password
        viewModel.isSubmitting = isSubmitting
        return viewModel
    }
}
