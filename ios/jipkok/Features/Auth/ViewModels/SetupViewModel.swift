import Observation

private let nicknameMaxLength = 10
private let birthYearLength = 4
private let bioMaxLength = 1000

@Observable
@MainActor
final class SetupViewModel {

    var nickname = ""
    var birthYear = ""
    var bio = ""
    var errorMessage: String?

    private(set) var isSubmitting = false

    var canSubmit: Bool {
        !nickname.isEmpty && birthYear.count == birthYearLength && !isSubmitting
    }

    var isShowingError: Bool {
        get { errorMessage != nil }
        set { if !newValue { errorMessage = nil } }
    }

    private let session: AuthSession
    private let client: Client

    init(session: AuthSession, client: Client = APIClient.authenticated()) {
        self.session = session
        self.client = client
    }

    func sanitizeNickname() {
        nickname = String(nickname.prefix(nicknameMaxLength))
    }

    func sanitizeBirthYear() {
        birthYear = String(birthYear.filter(\.isNumber).prefix(birthYearLength))
    }

    func sanitizeBio() {
        bio = String(bio.prefix(bioMaxLength))
    }

    func submit() async {
        guard canSubmit, let year = Int32(birthYear) else { return }

        isSubmitting = true

        defer { isSubmitting = false }

        do {
            _ = try await client.setupProfile(
                .init(
                    body: .json(
                        .init(
                            nickname: nickname,
                            birthYear: year,
                            bio: bio.isEmpty ? nil : bio
                        )
                    )
                )
            )

            session.completeSetup()
        } catch {
            errorMessage = APIError.from(error).message
        }
    }
}
