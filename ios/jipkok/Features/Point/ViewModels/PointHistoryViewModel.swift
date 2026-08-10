import Observation

@Observable
@MainActor
final class PointHistoryViewModel {

    var message: String?

    private(set) var balance: Int?
    private(set) var items: [PointHistory] = []
    private(set) var isLoading = false

    private var nextCursor: Int64?
    private var hasLoaded = false

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    var isEmpty: Bool {
        hasLoaded && items.isEmpty
    }

    private let repository: PointRepository

    init(repository: PointRepository = PointRepository()) {
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
            async let balance = repository.findBalance()
            async let page = repository.findHistories(cursor: nil)

            self.balance = try await balance
            items = try await page.items
            nextCursor = try await page.nextCursor
            hasLoaded = true
        } catch {
            message = APIError.from(error).message
        }
    }

    func loadMore() async {
        guard !isLoading, let cursor = nextCursor else { return }

        isLoading = true

        defer { isLoading = false }

        do {
            let page = try await repository.findHistories(cursor: cursor)
            items += page.items
            nextCursor = page.nextCursor
        } catch {
            message = APIError.from(error).message
        }
    }
}
