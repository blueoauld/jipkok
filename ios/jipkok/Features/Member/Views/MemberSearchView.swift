import SwiftUI

struct MemberSearchView: View {
    
    @State private var viewModel = MemberSearchViewModel()
    
    init() {}
    
    fileprivate init(viewModel: MemberSearchViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }
    
    var body: some View {
        content
            .navigationTitle("회원 검색")
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
            ContentUnavailableView(
                "닉네임을 \(minKeywordLength)자 이상 입력해 주세요.",
                systemImage: "magnifyingglass"
            )
        } else {
            switch viewModel.displayState {
            case .loading:
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case .empty:
                ContentUnavailableView.search(text: viewModel.keyword)
            case .content:
                memberList
            }
        }
    }
    
    private var memberList: some View {
        ScrollView {
            LazyVStack(spacing: rowSpacing) {
                ForEach(viewModel.members) { member in
                    NavigationLink(value: MemberRoute.memberDetail(id: member.id)) {
                        MemberRow(member: member)
                    }
                    .buttonStyle(.plain)
                    .task { await loadMoreIfNeeded(for: member) }
                }
                
                if viewModel.isLoading {
                    ProgressView()
                        .padding()
                }
            }
            .padding()
        }
        .scrollDismissesKeyboard(.interactively)
    }
    
    private func loadMoreIfNeeded(for member: Member) async {
        guard member.id == viewModel.members.last?.id else { return }
        
        await viewModel.loadMore()
    }
}

#Preview("기본") {
    NavigationStack {
        MemberSearchView()
    }
}

#Preview("결과 목록") {
    NavigationStack {
        MemberSearchView(viewModel: .preview(keyword: "철수", members: Member.previews))
    }
}

#Preview("추가 로딩") {
    NavigationStack {
        MemberSearchView(viewModel: .preview(keyword: "철수", members: Member.previews, isLoading: true))
    }
}

#Preview("로딩 중") {
    NavigationStack {
        MemberSearchView(viewModel: .preview(keyword: "철수", isLoading: true))
    }
}

#Preview("결과 없음") {
    NavigationStack {
        MemberSearchView(viewModel: .preview(keyword: "철수"))
    }
}
