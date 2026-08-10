import Observation

@Observable
@MainActor
final class RankViewModel {

    var genderFilter: GenderFilter
    var message: String?

    private(set) var members: [Member] = []
    private(set) var isLoading = false

    private var nextCursor: String?
    private var loadTask: Task<Void, Never>?
    private var generation = 0

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    private let repository: MemberRepository
    private let filterStore: MemberFilterStore

    init(
        repository: MemberRepository = MemberRepository(),
        filterStore: MemberFilterStore = MemberFilterStore()
    ) {
        self.repository = repository
        self.filterStore = filterStore
        self.genderFilter = filterStore.rankingGender
    }

    func loadIfNeeded() async {
        guard members.isEmpty, loadTask == nil else { return }

        await reload()
    }

    func reload() async {
        filterStore.rankingGender = genderFilter

        loadTask?.cancel()
        members = []
        nextCursor = nil

        await load(cursor: nil)
    }

    func loadMore() async {
        guard loadTask == nil, let cursor = nextCursor else { return }

        await load(cursor: cursor)
    }

    private func load(cursor: String?) async {
        generation += 1

        let generation = generation
        let genderFilter = genderFilter

        isLoading = true

        let task = Task {
            do {
                let page = try await repository.findRanking(gender: genderFilter, cursor: cursor)

                guard generation == self.generation else { return }

                members += page.members
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
