import Observation

@Observable
@MainActor
final class SetupViewModel {

    var nickname = ""
    var birthYear = ""
    var bio = ""
    var errorMessage: String?

    private(set) var isSubmitting = false

    var canSubmit: Bool {
        (Nickname.minLength...Nickname.maxLength).contains(trimmedNickname.count)
        && birthYear.count == BirthYear.length
        && !isSubmitting
    }

    private var trimmedNickname: String {
        Nickname.trimmed(nickname)
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
        nickname = Nickname.sanitized(nickname)
    }

    func sanitizeBirthYear() {
        birthYear = BirthYear.sanitized(birthYear)
    }

    func sanitizeBio() {
        bio = Bio.sanitized(bio)
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
                            nickname: trimmedNickname,
                            birthYear: year,
                            bio: bio.isEmpty ? nil : bio
                        )
                    )
                )
            )

            session.completeSetup()
        } catch {
            guard !error.isCancellation else { return }

            errorMessage = APIError.from(error).message
        }
    }
}

extension SetupViewModel {

    static func preview(
        nickname: String = "",
        birthYear: String = "",
        bio: String = "",
        isSubmitting: Bool = false
    ) -> SetupViewModel {
        let viewModel = SetupViewModel(session: AuthSession())
        viewModel.nickname = nickname
        viewModel.birthYear = birthYear
        viewModel.bio = bio
        viewModel.isSubmitting = isSubmitting
        return viewModel
    }
}
