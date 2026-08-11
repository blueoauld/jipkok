import SwiftUI

struct ChatSearchView: View {
    
    @State private var viewModel = ChatSearchViewModel()
    
    init() {}
    
    fileprivate init(viewModel: ChatSearchViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }
    
    var body: some View {
        content
            .navigationTitle("채팅 검색")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(
                text: $viewModel.keyword,
                placement: .navigationBarDrawer(displayMode: .always),
                prompt: "닉네임 입력"
            )
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .onChange(of: viewModel.keyword) { _, _ in
                viewModel.sanitizeKeyword()
                
                Task { await viewModel.search() }
            }
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(viewModel.message ?? "")
            }
    }
    
    @ViewBuilder
    private var content: some View {
        if !viewModel.isSearchable {
            ContentUnavailableView("닉네임을 입력해 주세요.", systemImage: "magnifyingglass")
        } else {
            switch viewModel.displayState {
            case .loading:
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case .empty:
                ContentUnavailableView.search(text: viewModel.keyword)
            case .content:
                roomList
            }
        }
    }
    
    private var roomList: some View {
        List {
            ForEach(viewModel.rooms) { room in
                ChatRow(room: room)
                    .listRowInsets(EdgeInsets(
                        top: rowSpacing / 2,
                        leading: listHorizontalPadding,
                        bottom: rowSpacing / 2,
                        trailing: listHorizontalPadding
                    ))
                    .listRowSeparator(.hidden)
                    .task { await loadMoreIfNeeded(for: room) }
            }
            
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .listRowSeparator(.hidden)
            }
        }
        .listStyle(.plain)
        .contentMargins(.vertical, searchListVerticalPadding - rowSpacing / 2, for: .scrollContent)
        .scrollDismissesKeyboard(.interactively)
    }
    
    private func loadMoreIfNeeded(for room: ChatRoom) async {
        guard room.id == viewModel.rooms.last?.id else { return }
        
        await viewModel.loadMore()
    }
}

#Preview("기본") {
    NavigationStack {
        ChatSearchView()
    }
}

#Preview("결과 목록") {
    NavigationStack {
        ChatSearchView(viewModel: .preview(keyword: "고양이", rooms: ChatRoom.samples))
    }
}

#Preview("로딩 중") {
    NavigationStack {
        ChatSearchView(viewModel: .preview(keyword: "고양이", isLoading: true))
    }
}

#Preview("결과 없음") {
    NavigationStack {
        ChatSearchView(viewModel: .preview(keyword: "고양이"))
    }
}
