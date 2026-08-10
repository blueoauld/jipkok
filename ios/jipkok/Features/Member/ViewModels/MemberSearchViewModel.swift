import Observation

let minKeywordLength = 2

private let debounce = Duration.milliseconds(300)

@Observable
@MainActor
final class MemberSearchViewModel {

    var keyword = ""
    var message: String?

    private(set) var members: [Member] = []
    private(set) var isLoading = false

    private var nextCursor: String?
    private var loadTask: Task<Void, Never>?
    private var generation = 0

    var isSearchable: Bool {
        Nickname.trimmed(keyword).count >= minKeywordLength
    }

    var displayState: DisplayState {
        if members.isEmpty {
            return isLoading ? .loading : .empty
        }

        return .content
    }

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    private let repository: MemberRepository

    init(repository: MemberRepository = MemberRepository()) {
        self.repository = repository
    }

    func sanitizeKeyword() {
        keyword = Nickname.sanitized(keyword)
    }

    func search() async {
        loadTask?.cancel()
        nextCursor = nil

        guard isSearchable else {
            members = []
            isLoading = false

            return
        }

        await load(cursor: nil, waitsForTyping: true)
    }

    func loadMore() async {
        guard loadTask == nil, let cursor = nextCursor else { return }

        await load(cursor: cursor, waitsForTyping: false)
    }

    private func load(cursor: String?, waitsForTyping: Bool) async {
        generation += 1

        let generation = generation
        let keyword = Nickname.trimmed(keyword)

        isLoading = true

        let task = Task {
            do {
                if waitsForTyping {
                    try await Task.sleep(for: debounce)
                }

                let page = try await repository.searchMembers(keyword: keyword, cursor: cursor)

                guard generation == self.generation else { return }

                members = cursor == nil ? page.members : members + page.members
                nextCursor = page.nextCursor
            } catch {
                guard !error.isCancellation else { return }

                guard generation == self.generation else { return }

                message = APIError.from(error).message
            }
        }

        loadTask = task

        await task.value

        guard generation == self.generation else { return }

        loadTask = nil
        isLoading = false
    }
}

extension MemberSearchViewModel {

    static func preview(
        keyword: String = "",
        members: [Member] = [],
        isLoading: Bool = false
    ) -> MemberSearchViewModel {
        let viewModel = MemberSearchViewModel()
        viewModel.keyword = keyword
        viewModel.members = members
        viewModel.isLoading = isLoading
        viewModel.loadTask = Task {}
        return viewModel
    }
}
