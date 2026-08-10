import SwiftUI

private let commentMaxLength = 100

struct MainView: View {

    @State private var router = MemberRouter()
    @State private var viewModel = MainViewModel()
    @State private var isWritingComment = false
    @State private var comment = ""

    var body: some View {
        NavigationStack(path: $router.path) {
            memberList
                .safeAreaInset(edge: .top) {
                    sortPicker
                }
                .navigationDestination(for: MemberRoute.self) { route in
                    switch route {
                    case .search: MemberSearchView()
                    case .memberDetail: MemberDetailView(member: .sample)
                    }
                }
                .navigationTitle("메인")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("회원 검색", systemImage: "magnifyingglass") {
                            router.push(.search)
                        }
                    }

                    ToolbarItem(placement: .topBarTrailing) {
                        genderMenu
                    }

                    ToolbarItem(placement: .topBarTrailing) {
                        Button("코멘트 작성", systemImage: "square.and.pencil") {
                            isWritingComment = true
                        }
                    }
                }
                .alert("코멘트", isPresented: $isWritingComment) {
                    TextField("내용 입력 (100자)", text: $comment)

                    Button("작성") {}

                    Button("닫기", role: .cancel) {}
                }
                .onChange(of: comment) { _, newValue in
                    comment = String(newValue.prefix(commentMaxLength))
                }
                .alert("알림", isPresented: $viewModel.isShowingError) {
                    Button("확인", role: .cancel) {}
                } message: {
                    Text(viewModel.errorMessage ?? "")
                }
                .task { await viewModel.loadIfNeeded() }
                .onChange(of: viewModel.sort) { _, _ in Task { await viewModel.reload() } }
                .onChange(of: viewModel.genderFilter) { _, _ in Task { await viewModel.reload() } }
                .refreshable { await viewModel.reload() }
        }
        .toolbar(router.path.isEmpty ? .visible : .hidden, for: .tabBar)
    }

    private func loadMoreIfNeeded(for member: Member) async {
        guard member.id == viewModel.members.last?.id else { return }

        await viewModel.loadMore()
    }

    private var memberList: some View {
        ScrollView {
            LazyVStack(spacing: rowSpacing) {
                ForEach(viewModel.members) { member in
                    Button {
                        router.push(.memberDetail(id: member.id))
                    } label: {
                        MemberRow(member: member)
                    }
                    .buttonStyle(.plain)
                    .task { await loadMoreIfNeeded(for: member) }
                }

                if viewModel.isLoading, !viewModel.members.isEmpty {
                    ProgressView()
                        .padding()
                }
            }
            .padding(.horizontal)
            .padding(.top, listTopPadding)
            .padding(.bottom)
        }
        .overlay {
            if viewModel.isLoading, viewModel.members.isEmpty {
                ProgressView()
            }
        }
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

    private var sortPicker: some View {
        Picker("정렬", selection: $viewModel.sort) {
            ForEach(MemberSort.allCases, id: \.self) { item in
                Text(item.label)
                    .tag(item)
            }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.bar)
    }
}

#Preview {
    MainView()
}
