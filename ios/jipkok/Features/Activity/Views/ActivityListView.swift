import SwiftUI

struct ActivityListView: View {
    
    @State private var viewModel: ActivityListViewModel
    
    init(kind: ActivityKind) {
        _viewModel = State(wrappedValue: ActivityListViewModel(kind: kind))
    }

    fileprivate init(viewModel: ActivityListViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }
    
    var body: some View {
        content
            .navigationTitle(viewModel.kind.title)
            .navigationBarTitleDisplayMode(.inline)
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(viewModel.message ?? "")
            }
            .loadingOverlay(viewModel.isProcessing)
            .task { await viewModel.loadIfNeeded() }
    }
    
    private var content: some View {
        ScrollView {
            switch viewModel.displayState {
            case .loading:
                ProgressView()
                    .containerRelativeFrame([.horizontal, .vertical])
            case .empty:
                ContentUnavailableView("목록이 비어있습니다.", systemImage: "tray")
                    .containerRelativeFrame([.horizontal, .vertical])
            case .content:
                itemList
            }
        }
        .scrollIndicators(.hidden)
        .refreshable { await viewModel.reload() }
    }
    
    private var itemList: some View {
        LazyVStack(spacing: rowSpacing) {
            ForEach(viewModel.items) { item in
                NavigationLink(value: SettingRoute.memberDetail(id: item.member.id)) {
                    ActivityRow(
                        member: item.member,
                        caption: item.viewedAt.map { relativeTime(from: $0) },
                        onDelete: deleteAction(for: item)
                    )
                }
                .buttonStyle(.plain)
                .task { await loadMoreIfNeeded(for: item) }
            }
            
            if viewModel.isLoading {
                ProgressView()
                    .padding()
            }
        }
        .padding()
    }
    
    private func deleteAction(for item: ActivityItem) -> (() -> Void)? {
        guard viewModel.kind.isDeletable else { return nil }
        
        return { Task { await viewModel.delete(item) } }
    }
    
    private func loadMoreIfNeeded(for item: ActivityItem) async {
        guard item.id == viewModel.items.last?.id else { return }
        
        await viewModel.loadMore()
    }
}

#Preview("목록") {
    NavigationStack {
        ActivityListView(
            viewModel: .preview(items: Member.previews.map { ActivityItem(member: $0, viewedAt: nil) })
        )
    }
}

#Preview("삭제 처리 중") {
    NavigationStack {
        ActivityListView(
            viewModel: .preview(
                items: Member.previews.map { ActivityItem(member: $0, viewedAt: nil) },
                isProcessing: true
            )
        )
    }
}

#Preview("로딩 중") {
    NavigationStack {
        ActivityListView(viewModel: .preview(isLoading: true))
    }
}

#Preview("빈 상태") {
    NavigationStack {
        ActivityListView(viewModel: .preview())
    }
}
