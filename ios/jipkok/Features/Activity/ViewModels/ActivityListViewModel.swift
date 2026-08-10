import Observation

@Observable
@MainActor
final class ActivityListViewModel {

    let kind: ActivityKind

    var message: String?

    private(set) var items: [ActivityItem] = []
    private(set) var isLoading = false
    private(set) var isProcessing = false

    private var nextCursor: String?
    private var hasLoaded = false

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    var isEmpty: Bool {
        hasLoaded && items.isEmpty
    }

    private let repository: ActivityRepository

    init(kind: ActivityKind, repository: ActivityRepository = ActivityRepository()) {
        self.kind = kind
        self.repository = repository
    }

    func loadIfNeeded() async {
        guard !hasLoaded, !isLoading else { return }

        await reload()
    }

    func reload() async {
        guard !isLoading else { return }

        isLoading = true

        defer { isLoading = false }

        do {
            let page = try await repository.findItems(kind: kind, cursor: nil)
            items = page.items
            nextCursor = page.nextCursor
            hasLoaded = true

            await markSeenIfNeeded()
        } catch {
            message = APIError.from(error).message
        }
    }

    func loadMore() async {
        guard !isLoading, let cursor = nextCursor else { return }

        isLoading = true

        defer { isLoading = false }

        do {
            let page = try await repository.findItems(kind: kind, cursor: cursor)
            items += page.items
            nextCursor = page.nextCursor
        } catch {
            message = APIError.from(error).message
        }
    }

    func delete(_ item: ActivityItem) async {
        guard kind.isDeletable, !isProcessing else { return }

        isProcessing = true

        defer { isProcessing = false }

        do {
            try await repository.remove(kind: kind, memberId: item.member.id)

            items.removeAll { $0.id == item.id }
        } catch {
            message = APIError.from(error).message
        }
    }

    private func markSeenIfNeeded() async {
        guard kind == .profileView else { return }

        try? await repository.markProfileViewsSeen()
    }
}
