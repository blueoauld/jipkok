import Observation

@Observable
@MainActor
final class MyProfileViewModel {

    var message: String?

    private(set) var profile: MyProfile?
    private(set) var isLoading = false

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    private let repository: MemberRepository

    init(repository: MemberRepository = MemberRepository()) {
        self.repository = repository
    }

    func load() async {
        guard !isLoading else { return }

        isLoading = true

        defer { isLoading = false }

        do {
            profile = try await repository.findMyProfile()
        } catch {
            message = APIError.from(error).message
        }
    }
}
