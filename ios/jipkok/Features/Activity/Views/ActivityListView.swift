import SwiftUI

struct ActivityListView: View {

    let kind: ActivityKind

    var body: some View {
        ScrollView {
            LazyVStack(spacing: rowSpacing) {
                ForEach(Member.previews) { member in
                    ActivityRow(
                        member: member,
                        caption: caption(for: member),
                        onDelete: kind.isDeletable ? {} : nil
                    )
                }
            }
            .padding()
        }
        .scrollIndicators(.hidden)
        .navigationTitle(kind.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func caption(for member: Member) -> String? {
        guard kind == .profileView else { return nil }

        return member.locatedAt.map { relativeTime(from: $0) }
    }
}

#Preview("삭제 가능") {
    NavigationStack {
        ActivityListView(kind: .like)
    }
}

#Preview("조회 목록") {
    NavigationStack {
        ActivityListView(kind: .profileView)
    }
}
