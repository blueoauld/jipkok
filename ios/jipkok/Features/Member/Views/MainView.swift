import SwiftUI

struct MainView: View {

    @State private var router = MemberRouter()
    @State private var viewModel = MainViewModel()

    init() {}

    fileprivate init(viewModel: MainViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }

    var body: some View {
        NavigationStack(path: $router.path) {
            memberList
                .safeAreaInset(edge: .top) {
                    sortPicker
                }
                .navigationDestination(for: MemberRoute.self) { route in
                    switch route {
                    case .search: MemberSearchView()
                    case .memberDetail(let id): MemberDetailView(id: id)
                    }
                }
                .navigationTitle("메인")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("회원 검색", systemImage: "magnifyingglass") {
                            router.push(MemberRoute.search)
                        }
                    }

                    ToolbarItem(placement: .topBarTrailing) {
                        genderMenu
                    }

                    ToolbarItem(placement: .topBarTrailing) {
                        Button("코멘트 작성", systemImage: "square.and.pencil") {
                            viewModel.isWritingComment = true
                        }
                    }
                }
                .alert("코멘트", isPresented: $viewModel.isWritingComment) {
                    TextField("내용 입력 (\(commentMaxLength)자)", text: $viewModel.comment)

                    Button("작성") {
                        Task { await viewModel.updateComment() }
                    }

                    Button("닫기", role: .cancel) {}
                }
                .onChange(of: viewModel.comment) { _, _ in viewModel.sanitizeComment() }
                .alert("알림", isPresented: $viewModel.isShowingMessage) {
                    Button("확인", role: .cancel) {}
                } message: {
                    Text(viewModel.message ?? "")
                }
                .task { await viewModel.loadIfNeeded() }
                .onChange(of: viewModel.sort) { _, _ in Task { await viewModel.sortChanged() } }
                .onChange(of: viewModel.genderFilter) { _, _ in Task { await viewModel.refresh() } }
                .refreshable { await viewModel.refresh() }
                .loadingOverlay(viewModel.isProcessing)
        }
        .toolbar(router.path.isEmpty ? .visible : .hidden, for: .tabBar)
    }

    private func loadMoreIfNeeded(for member: Member) async {
        guard member.id == viewModel.members.last?.id else { return }

        await viewModel.loadMore()
    }

    private var memberList: some View {
        ScrollView {
            switch viewModel.displayState {
            case .loading:
                ProgressView()
                    .containerRelativeFrame([.horizontal, .vertical])
            case .empty:
                ContentUnavailableView("회원이 없습니다.", systemImage: "person.2.slash")
                    .containerRelativeFrame([.horizontal, .vertical])
            case .content:
                LazyVStack(spacing: rowSpacing) {
                    ForEach(viewModel.members) { member in
                        Button {
                            router.push(MemberRoute.memberDetail(id: member.id))
                        } label: {
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
                .padding(.horizontal)
                .padding(.top, listTopPadding)
                .padding(.bottom)
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

#Preview("목록") {
    MainView(viewModel: .preview(members: Member.previews))
}

#Preview("추가 로딩") {
    MainView(viewModel: .preview(members: Member.previews, isLoading: true))
}

#Preview("로딩 중") {
    MainView(viewModel: .preview(isLoading: true))
}

#Preview("빈 상태") {
    MainView(viewModel: .preview())
}

#Preview("코멘트 작성 중") {
    MainView(viewModel: .preview(members: Member.previews, isProcessing: true))
}
