import SwiftUI

struct PointHistoryView: View {
    
    @State private var viewModel = PointHistoryViewModel()
    
    init() {}
    
    fileprivate init(viewModel: PointHistoryViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }
    
    var body: some View {
        content
            .navigationTitle("포인트 내역")
            .navigationBarTitleDisplayMode(.inline)
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(viewModel.message ?? "")
            }
            .task { await viewModel.loadIfNeeded() }
    }
    
    private var content: some View {
        ScrollView {
            switch viewModel.displayState {
            case .loading:
                ProgressView()
                    .containerRelativeFrame([.horizontal, .vertical])
            case .empty:
                ContentUnavailableView("내역이 비어있습니다.", systemImage: "tray")
                    .containerRelativeFrame([.horizontal, .vertical])
            case .content:
                LazyVStack(spacing: rowSpacing) {
                    ForEach(viewModel.items) { history in
                        historyRow(history)
                            .task { await loadMoreIfNeeded(for: history) }
                    }
                    
                    if viewModel.isLoading {
                        ProgressView()
                            .padding()
                    }
                }
                .padding(.horizontal)
                .padding(.top, listTopPadding)
                .padding(.bottom)
            }
        }
        .scrollIndicators(.hidden)
        .safeAreaInset(edge: .top) {
            balanceCard
        }
    }
    
    private var balanceCard: some View {
        HStack {
            Text("보유 포인트")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
            
            Spacer()
            
            Text(viewModel.balance.map { $0.formatted() } ?? "-")
                .font(.title3.bold())
        }
        .padding()
        .background(Color(.secondarySystemBackground), in: .rect(cornerRadius: fieldCornerRadius))
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.background)
    }
    
    private func historyRow(_ history: PointHistory) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(history.kind.label)
                    .font(.subheadline)
                
                Text(history.recordedAt.formatted(date: .abbreviated, time: .shortened))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Text(amountText(history.amount))
                .font(.subheadline.bold())
                .foregroundStyle(history.amount > 0 ? .red : .blue)
        }
    }
    
    private func amountText(_ amount: Int) -> String {
        amount > 0 ? "+\(amount.formatted())" : amount.formatted()
    }
    
    private func loadMoreIfNeeded(for history: PointHistory) async {
        guard history.id == viewModel.items.last?.id else { return }
        
        await viewModel.loadMore()
    }
}

#Preview("목록") {
    NavigationStack {
        PointHistoryView(viewModel: .preview(balance: 1_200, items: PointHistory.previews))
    }
}

#Preview("추가 로딩") {
    NavigationStack {
        PointHistoryView(
            viewModel: .preview(balance: 1_200, items: PointHistory.previews, isLoading: true)
        )
    }
}

#Preview("로딩 중") {
    NavigationStack {
        PointHistoryView(viewModel: .preview(isLoading: true))
    }
}

#Preview("빈 상태") {
    NavigationStack {
        PointHistoryView(viewModel: .preview(balance: 0))
    }
}
