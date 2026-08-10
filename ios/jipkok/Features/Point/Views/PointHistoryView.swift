import SwiftUI

struct PointHistoryView: View {

    @State private var viewModel = PointHistoryViewModel()

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

    @ViewBuilder
    private var content: some View {
        if !viewModel.items.isEmpty || viewModel.isEmpty {
            historyList
        } else {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private var historyList: some View {
        ScrollView {
            LazyVStack(spacing: rowSpacing) {
                balanceCard

                if viewModel.isEmpty {
                    ContentUnavailableView("내역이 비어있습니다.", systemImage: "tray")
                        .padding(.top, 40)
                } else {
                    ForEach(viewModel.items) { history in
                        historyRow(history)
                            .task { await loadMoreIfNeeded(for: history) }
                    }

                    if viewModel.isLoading {
                        ProgressView()
                            .padding()
                    }
                }
            }
            .padding()
        }
        .scrollIndicators(.hidden)
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
        .padding(.bottom, 4)
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

#Preview {
    NavigationStack {
        PointHistoryView()
    }
}
