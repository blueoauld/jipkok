import SwiftUI

private let nicknameMaxLength = 10

struct ChatSearchView: View {

    @State private var keyword = ""

    private var results: [ChatRoom] {
        guard !keyword.isEmpty else { return [] }

        return ChatRoom.samples.filter { $0.nickname.contains(keyword) }
    }

    var body: some View {
        content
            .navigationTitle("채팅 검색")
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
        if keyword.isEmpty {
            ContentUnavailableView("닉네임을 입력해 주세요.", systemImage: "magnifyingglass")
        } else if results.isEmpty {
            ContentUnavailableView.search(text: keyword)
        } else {
            roomList
        }
    }

    private var roomList: some View {
        List(results) { room in
            ChatRow(room: room)
                .listRowInsets(EdgeInsets(
                    top: rowSpacing / 2,
                    leading: listHorizontalPadding,
                    bottom: rowSpacing / 2,
                    trailing: listHorizontalPadding
                ))
                .listRowSeparator(.hidden)
        }
        .listStyle(.plain)
        .contentMargins(.vertical, searchListVerticalPadding - rowSpacing / 2, for: .scrollContent)
        .scrollDismissesKeyboard(.interactively)
    }
}

#Preview {
    NavigationStack {
        ChatSearchView()
    }
}
