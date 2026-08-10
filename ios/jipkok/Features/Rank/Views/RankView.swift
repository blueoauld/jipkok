import SwiftUI

struct RankView: View {
    
    @State private var router = RankRouter()
    @State private var viewModel = RankViewModel()
    
    var body: some View {
        NavigationStack(path: $router.path) {
            memberList
                .safeAreaInset(edge: .top) {
                    genderPicker
                }
                .navigationDestination(for: RankRoute.self) { route in
                    switch route {
                    case .memberDetail(let id): MemberDetailView(id: id)
                    }
                }
                .navigationTitle("랭킹")
                .navigationBarTitleDisplayMode(.inline)
                .alert("알림", isPresented: $viewModel.isShowingMessage) {
                    Button("확인", role: .cancel) {}
                } message: {
                    Text(viewModel.message ?? "")
                }
                .task { await viewModel.loadIfNeeded() }
                .onChange(of: viewModel.genderFilter) { _, _ in Task { await viewModel.reload() } }
                .refreshable { await viewModel.reload() }
        }
        .toolbar(router.path.isEmpty ? .visible : .hidden, for: .tabBar)
    }
    
    private var memberList: some View {
        ScrollView {
            LazyVStack(spacing: rowSpacing) {
                ForEach(viewModel.members) { member in
                    Button {
                        router.push(RankRoute.memberDetail(id: member.id))
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
    
    private var genderPicker: some View {
        Picker("성별", selection: $viewModel.genderFilter) {
            ForEach(GenderFilter.allCases, id: \.self) { item in
                Text(item.label)
                    .tag(item)
            }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.bar)
    }
    
    private func loadMoreIfNeeded(for member: Member) async {
        guard member.id == viewModel.members.last?.id else { return }
        
        await viewModel.loadMore()
    }
}

#Preview {
    RankView()
}
