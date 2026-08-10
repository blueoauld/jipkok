import Observation

@Observable
@MainActor
final class MemberDetailViewModel {

    var message: String?

    private(set) var member: MemberDetail?
    private(set) var isLoading = false

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    private let id: Int
    private let repository: MemberRepository

    init(id: Int, repository: MemberRepository = MemberRepository()) {
        self.id = id
        self.repository = repository
    }

    func loadIfNeeded() async {
        guard member == nil, !isLoading else { return }

        isLoading = true

        defer { isLoading = false }

        do {
            member = try await repository.findDetail(id: id)
        } catch {
            message = APIError.from(error).message
        }
    }
}
