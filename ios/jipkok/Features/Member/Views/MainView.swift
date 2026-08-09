import SwiftUI

private let commentMaxLength = 100

struct MainView: View {

    private enum Sort: CaseIterable {
        case latest
        case distance

        var label: String {
            switch self {
            case .latest: "최근"
            case .distance: "거리"
            }
        }
    }

    @State private var sort: Sort = .latest
    @State private var genderFilter: GenderFilter = .all
    @State private var isWritingComment = false
    @State private var comment = ""

    var body: some View {
        NavigationStack {
            memberList
                .safeAreaInset(edge: .top) {
                    sortPicker
                }
                .navigationTitle("메인")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("회원 검색", systemImage: "magnifyingglass") {}
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
        }
    }

    private var memberList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(Member.samples) { member in
                    MemberRow(member: member)
                }
            }
            .padding(.horizontal)
            .padding(.top, 8)
            .padding(.bottom)
        }
    }

    private var genderMenu: some View {
        Menu("성별 선택", systemImage: "line.3.horizontal.decrease") {
            Picker("성별", selection: $genderFilter) {
                ForEach(GenderFilter.allCases, id: \.self) { item in
                    Text(item.label)
                        .tag(item)
                }
            }
        }
    }

    private var sortPicker: some View {
        Picker("정렬", selection: $sort) {
            ForEach(Sort.allCases, id: \.self) { item in
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
