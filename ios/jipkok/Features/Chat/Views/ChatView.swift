import SwiftUI

struct ChatView: View {

    @State private var router = ChatRouter()
    @State private var viewModel = ChatViewModel()

    init() {}

    fileprivate init(viewModel: ChatViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }

    var body: some View {
        NavigationStack(path: $router.path) {
            roomList
                .safeAreaInset(edge: .top) {
                    filterPicker
                }
                .navigationDestination(for: ChatRoute.self) { route in
                    switch route {
                    case .search: ChatSearchView()
                    case .room(let room): ChatRoomView(room: room)
                    }
                }
                .navigationTitle("채팅")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("채팅 검색", systemImage: "magnifyingglass") {
                            router.push(ChatRoute.search)
                        }
                    }

                    ToolbarItem(placement: .topBarTrailing) {
                        noteReceiveButton
                    }
                }
                .alert("알림", isPresented: $viewModel.isConfirmingLeave, presenting: viewModel.leavingRoom) { room in
                    Button("나가기", role: .destructive) {
                        Task { await viewModel.leave(room) }
                    }

                    Button("닫기", role: .cancel) {}
                } message: { _ in
                    Text("나가면 대화 내역이 모두 사라집니다.")
                }
                .alert("알림", isPresented: $viewModel.isShowingMessage) {
                    Button("확인", role: .cancel) {}
                } message: {
                    Text(viewModel.message ?? "")
                }
                .loadingOverlay(viewModel.isProcessing)
                .task { await viewModel.loadIfNeeded() }
                .task { await viewModel.observeSocket() }
                .onAppear { Task { await viewModel.refresh() } }
                .onChange(of: viewModel.filter) { _, _ in Task { await viewModel.reload() } }
        }
        .toolbar(router.path.isEmpty ? .visible : .hidden, for: .tabBar)
    }

    @ViewBuilder
    private var roomList: some View {
        switch viewModel.displayState {
        case .loading:
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        case .empty:
            ContentUnavailableView("채팅이 없습니다.", systemImage: "bubble.left.and.bubble.right")
        case .content:
            List {
                ForEach(viewModel.rooms) { room in
                    Button {
                        router.push(ChatRoute.room(room))
                    } label: {
                        ChatRow(room: room)
                    }
                    .buttonStyle(.plain)
                    .listRowInsets(EdgeInsets(
                        top: rowSpacing / 2,
                        leading: listHorizontalPadding,
                        bottom: rowSpacing / 2,
                        trailing: listHorizontalPadding
                    ))
                    .listRowSeparator(.hidden)
                    .swipeActions(edge: .leading, allowsFullSwipe: false) {
                        notificationAction(for: room)
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        leaveAction(for: room)
                    }
                    .task { await loadMoreIfNeeded(for: room) }
                }

                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .listRowSeparator(.hidden)
                }
            }
            .listStyle(.plain)
            .contentMargins(.top, listTopPadding - rowSpacing / 2, for: .scrollContent)
            .contentMargins(.bottom, listBottomPadding - rowSpacing / 2, for: .scrollContent)
        }
    }

    private func loadMoreIfNeeded(for room: ChatRoom) async {
        guard room.id == viewModel.rooms.last?.id else { return }

        await viewModel.loadMore()
    }

    private var filterPicker: some View {
        Picker("필터", selection: $viewModel.filter) {
            ForEach(ChatViewModel.Filter.allCases, id: \.self) { item in
                Text(item.label)
                    .tag(item)
            }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.bar)
    }

    private func notificationAction(for room: ChatRoom) -> some View {
        Button {
            Task { await viewModel.toggleNotification(room) }
        } label: {
            Label(
                room.isNotificationEnabled ? "알림 끄기" : "알림 켜기",
                systemImage: room.isNotificationEnabled ? "bell.slash.fill" : "bell.fill"
            )
            .labelStyle(.iconOnly)
        }
        .tint(.accentColor)
    }

    private func leaveAction(for room: ChatRoom) -> some View {
        Button {
            viewModel.leavingRoom = room
        } label: {
            Label("나가기", systemImage: "rectangle.portrait.and.arrow.right.fill")
                .labelStyle(.iconOnly)
        }
        .tint(.red)
    }

    private var noteReceiveButton: some View {
        Button {
            Task { await viewModel.toggleNoteReceive() }
        } label: {
            Image(systemName: viewModel.isNoteReceiveEnabled ? "bell" : "bell.slash")
                .contentTransition(.symbolEffect(.replace))
                .animation(.easeOut(duration: 0.15), value: viewModel.isNoteReceiveEnabled)
        }
        .accessibilityLabel(viewModel.isNoteReceiveEnabled ? "쪽지 받지 않기" : "쪽지 받기")
    }
}

#Preview("기본") {
    ChatView()
}

#Preview("목록") {
    ChatView(viewModel: .preview(rooms: ChatRoom.samples))
}

#Preview("추가 로딩") {
    ChatView(viewModel: .preview(rooms: ChatRoom.samples, isLoading: true))
}

#Preview("로딩 중") {
    ChatView(viewModel: .preview(isLoading: true))
}

#Preview("빈 상태") {
    ChatView(viewModel: .preview())
}
