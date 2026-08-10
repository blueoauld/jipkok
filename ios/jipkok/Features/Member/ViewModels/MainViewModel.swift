import Observation

let commentMaxLength = 100

@Observable
@MainActor
final class MainViewModel {

    var sort: MemberSort
    var genderFilter: GenderFilter
    var comment = ""
    var isWritingComment = false
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
        self.sort = filterStore.sort
        self.genderFilter = filterStore.gender
    }

    func sanitizeComment() {
        comment = String(comment.prefix(commentMaxLength))
    }

    func updateComment() async {
        do {
            _ = try await repository.updateComment(comment.isEmpty ? nil : comment)
            message = "코멘트를 작성하셨습니다."
        } catch {
            message = APIError.from(error).message
        }
    }

    func loadIfNeeded() async {
        guard members.isEmpty, loadTask == nil else { return }

        await reload()
    }

    func reload() async {
        filterStore.sort = sort
        filterStore.gender = genderFilter

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
        let sort = sort
        let genderFilter = genderFilter

        isLoading = true

        let task = Task {
            do {
                let page = try await repository.findMembers(sort: sort, gender: genderFilter, cursor: cursor)

                guard generation == self.generation else { return }

                members += page.members
                nextCursor = page.nextCursor
            } catch {
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
