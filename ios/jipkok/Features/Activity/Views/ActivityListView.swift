import SwiftUI

struct ActivityListView: View {
    
    @State private var viewModel: ActivityListViewModel
    
    init(kind: ActivityKind) {
        _viewModel = State(wrappedValue: ActivityListViewModel(kind: kind))
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
    
    @ViewBuilder
    private var content: some View {
        if viewModel.isEmpty {
            ContentUnavailableView("목록이 비어있습니다.", systemImage: "tray")
        } else if viewModel.items.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            itemList
        }
    }
    
    private var itemList: some View {
        ScrollView {
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
        .scrollIndicators(.hidden)
        .refreshable { await viewModel.reload() }
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

#Preview {
    NavigationStack {
        ActivityListView(kind: .like)
    }
}
