import SwiftUI

struct FeedView: View {
    
    @State private var viewModel = FeedViewModel()
    @State private var isPickingDate = false
    
    var body: some View {
        NavigationStack {
            postList
                .overlay(alignment: .bottom) {
                    dateButton
                }
                .sheet(isPresented: $isPickingDate) {
                    datePicker
                }
                .safeAreaInset(edge: .top) {
                    sortPicker
                }
                .navigationTitle("피드")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        notificationButton
                    }
                    
                    ToolbarItem(placement: .topBarTrailing) {
                        genderMenu
                    }
                    
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("피드 작성", systemImage: "square.and.pencil") {}
                    }
                }
                .alert("알림", isPresented: $viewModel.isConfirmingReport, presenting: viewModel.reportingPost) { post in
                    Button("신고", role: .destructive) {
                        Task { await viewModel.report(post) }
                    }
                    
                    Button("닫기", role: .cancel) {}
                } message: { _ in
                    Text("이 피드를 신고하시겠습니까?")
                }
                .alert("알림", isPresented: $viewModel.isShowingMessage) {
                    Button("확인", role: .cancel) {}
                } message: {
                    Text(viewModel.message ?? "")
                }
                .loadingOverlay(viewModel.isProcessing)
                .task { await viewModel.loadIfNeeded() }
                .onChange(of: viewModel.sort) { _, _ in Task { await viewModel.reload() } }
                .onChange(of: viewModel.genderFilter) { _, _ in Task { await viewModel.reload() } }
                .onChange(of: viewModel.date) { _, _ in Task { await viewModel.reload() } }
                .refreshable { await viewModel.reload() }
        }
    }
    
    @ViewBuilder
    private var postList: some View {
        if viewModel.isEmpty {
            ContentUnavailableView("피드가 없습니다.", systemImage: "flame")
        } else {
            ScrollView {
                LazyVStack(spacing: rowSpacing) {
                    ForEach(viewModel.posts) { post in
                        FeedCard(
                            post: post,
                            onLike: { Task { await viewModel.toggleLike(post) } },
                            onReport: { viewModel.reportingPost = post }
                        )
                        .task { await loadMoreIfNeeded(for: post) }
                    }
                    
                    if viewModel.isLoading, !viewModel.posts.isEmpty {
                        ProgressView()
                            .padding()
                    }
                }
                .padding(.horizontal)
                .padding(.top, listTopPadding)
                .padding(.bottom)
            }
            .overlay {
                if viewModel.isLoading, viewModel.posts.isEmpty {
                    ProgressView()
                }
            }
        }
    }
    
    private func loadMoreIfNeeded(for post: FeedPost) async {
        guard post.id == viewModel.posts.last?.id else { return }
        
        await viewModel.loadMore()
    }
    
    private var dateButton: some View {
        Button {
            isPickingDate = true
        } label: {
            Text(dateLabel)
                .padding(.horizontal)
                .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
        .glassEffect(.regular.interactive(), in: .capsule)
        .padding(.bottom, listBottomPadding)
    }
    
    private var dateLabel: String {
        Calendar.current.isDateInToday(viewModel.date)
        ? "오늘"
        : viewModel.date.formatted(.dateTime.month(.abbreviated).day())
    }
    
    private var datePicker: some View {
        DatePicker("날짜", selection: $viewModel.date, displayedComponents: .date)
            .datePickerStyle(.graphical)
            .padding()
            .presentationDetents([.medium])
    }
    
    private var sortPicker: some View {
        Picker("정렬", selection: $viewModel.sort) {
            ForEach(FeedSort.allCases, id: \.self) { item in
                Text(item.label)
                    .tag(item)
            }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.bar)
    }
    
    private var notificationButton: some View {
        Button {
            Task { await viewModel.toggleNotification() }
        } label: {
            Image(systemName: viewModel.isNotificationEnabled ? "bell" : "bell.slash")
                .contentTransition(.symbolEffect(.replace))
                .animation(.easeOut(duration: 0.15), value: viewModel.isNotificationEnabled)
        }
        .accessibilityLabel(viewModel.isNotificationEnabled ? "알림 받지 않기" : "알림 받기")
    }
    
    private var genderMenu: some View {
        Menu("성별 선택", systemImage: "line.3.horizontal.decrease") {
            Picker("성별", selection: $viewModel.genderFilter) {
                ForEach(GenderFilter.allCases, id: \.self) { item in
                    Text(item.label)
                        .tag(item)
                }
            }
        }
    }
}

#Preview {
    FeedView()
}
