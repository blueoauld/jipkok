import SwiftUI

private let deleteButtonSize: CGFloat = 44

struct ActivityRow: View {

    let member: Member
    var caption: String?
    var onDelete: (() -> Void)?

    var body: some View {
        HStack(spacing: 12) {
            MemberAvatar(url: member.profileImageURL)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(member.nickname)
                        .font(.subheadline.bold())
                        .lineLimit(1)

                    Spacer()

                    if let caption {
                        Text(caption)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .layoutPriority(1)
                    }
                }

                Text("\(member.gender.label) · \(member.age)살 · ♥ \(member.receivedLikeCount.formatted())")
                    .font(.footnote)
                    .foregroundStyle(.secondary)

                Text(member.comment ?? "-")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            if let onDelete {
                deleteButton(onDelete)
            }
        }
    }

    private func deleteButton(_ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: "trash.fill")
                .font(.body)
                .foregroundStyle(.white)
                .frame(width: deleteButtonSize, height: deleteButtonSize)
                .background(.red, in: .circle)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("삭제")
    }
}

#Preview {
    VStack(spacing: 16) {
        ActivityRow(member: Member.previews[0], onDelete: {})
        ActivityRow(member: Member.previews[1])
        ActivityRow(member: Member.previews[2], caption: "3시간 전")
    }
    .padding()
}
