import SwiftUI

struct MemberSearchView: View {
    
    @State private var viewModel = MemberSearchViewModel()
    
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
        } else if viewModel.members.isEmpty {
            emptyResult
        } else {
            memberList
        }
    }
    
    @ViewBuilder
    private var emptyResult: some View {
        if viewModel.isLoading {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            ContentUnavailableView.search(text: viewModel.keyword)
        }
    }
    
    private var memberList: some View {
        ScrollView {
            LazyVStack(spacing: rowSpacing) {
                ForEach(viewModel.members) { member in
                    MemberRow(member: member)
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

#Preview {
    NavigationStack {
        MemberSearchView()
    }
}
