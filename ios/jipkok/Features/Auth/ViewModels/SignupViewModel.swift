import Observation

private let verificationCodeLength = 6
private let passwordMinLength = 8
private let passwordMaxLength = 30

@Observable
@MainActor
final class SignupViewModel {

    enum Gender: CaseIterable {
        case male
        case female

        var label: String {
            switch self {
            case .male: "남자"
            case .female: "여자"
            }
        }

        var payload: Components.Schemas.SignupRequest.GenderPayload {
            switch self {
            case .male: .male
            case .female: .female
            }
        }
    }

    var phoneNumber = ""
    var verificationCode = ""
    var password = ""
    var passwordConfirm = ""
    var gender: Gender?
    var message: String?

    private(set) var isSendingCode = false
    private(set) var isSubmitting = false

    var canSendCode: Bool {
        phoneNumber.count == PhoneNumber.length && !isSendingCode
    }

    var canSubmit: Bool {
        phoneNumber.count == PhoneNumber.length
        && verificationCode.count == verificationCodeLength
        && (passwordMinLength...passwordMaxLength).contains(password.count)
        && !passwordConfirm.isEmpty
        && gender != nil
        && !isSubmitting
    }

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    private let session: AuthSession
    private let client: Client
    
    init(session: AuthSession, client: Client = APIClient.make()) {
        self.session = session
        self.client = client
    }

    func sanitizePhoneNumber() {
        phoneNumber = PhoneNumber.sanitized(phoneNumber)
    }

    func sanitizeVerificationCode() {
        verificationCode = String(verificationCode.filter(\.isNumber).prefix(verificationCodeLength))
    }

    func sendCode() async {
        guard canSendCode else { return }

        isSendingCode = true

        defer { isSendingCode = false }

        do {
            _ = try await client.sendVerificationCode(.init(body: .json(.init(phoneNumber: phoneNumber))))
            message = "인증번호를 보냈습니다."
        } catch {
            message = APIError.from(error).message
        }
    }

    func submit() async {
        guard canSubmit, let gender else { return }

        isSubmitting = true

        defer { isSubmitting = false }

        do {
            let output = try await client.signup(
                .init(
                    body: .json(
                        .init(
                            phoneNumber: phoneNumber,
                            verificationCode: verificationCode,
                            password: password,
                            passwordConfirm: passwordConfirm,
                            gender: gender.payload
                        )
                    )
                )
            )
            let tokens = try output.created.body.json

            try session.completeSignup(accessToken: tokens.accessToken, refreshToken: tokens.refreshToken)
        } catch {
            message = APIError.from(error).message
        }
    }
}
