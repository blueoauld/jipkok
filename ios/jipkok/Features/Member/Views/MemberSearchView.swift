import SwiftUI

private let nicknameMaxLength = 10
private let minKeywordLength = 2

struct MemberSearchView: View {
    
    @State private var keyword = ""
    
    private var results: [Member] {
        guard keyword.count >= minKeywordLength else { return [] }
        
        return Member.samples.filter { $0.nickname.contains(keyword) }
    }
    
    var body: some View {
        content
            .navigationTitle("회원 검색")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(
                text: $keyword,
                placement: .navigationBarDrawer(displayMode: .always),
                prompt: "닉네임 입력"
            )
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .onChange(of: keyword) { _, newValue in
                keyword = String(newValue.prefix(nicknameMaxLength))
            }
    }
    
    @ViewBuilder
    private var content: some View {
        if keyword.count < minKeywordLength {
            ContentUnavailableView(
                "닉네임을 \(minKeywordLength)자 이상 입력해 주세요.",
                systemImage: "magnifyingglass"
            )
        } else if results.isEmpty {
            ContentUnavailableView.search(text: keyword)
        } else {
            memberList
        }
    }
    
    private var memberList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(results) { member in
                    MemberRow(member: member)
                }
            }
            .padding()
        }
        .scrollDismissesKeyboard(.interactively)
    }
}

#Preview {
    NavigationStack {
        MemberSearchView()
    }
}
