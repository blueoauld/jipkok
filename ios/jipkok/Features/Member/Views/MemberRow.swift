import SwiftUI

private let emptyComment = "-"

struct MemberRow: View {

    let member: Member

    var body: some View {
        HStack(spacing: 12) {
            MemberAvatar(url: member.profileImageURL)

            VStack(alignment: .leading, spacing: 4) {
                nameLine
                profileLine
                commentLine
            }
        }
        .contentShape(.rect)
    }
    
    private var nameLine: some View {
        HStack(alignment: .center, spacing: 4) {
            Text(member.nickname)
                .font(.subheadline.bold())
                .lineLimit(1)

            if member.isFavorited {
                Image(systemName: "star.fill")
                    .font(.caption)
                    .foregroundStyle(.yellow)
            }

            Spacer()

            if let locatedAt = member.locatedAt {
                Text(relativeTime(from: locatedAt))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .layoutPriority(1)
            }
        }
    }

    private var profileLine: some View {
        HStack {
            Text("\(member.gender.label) · \(member.age)살 · ♥ \(member.receivedLikeCount.formatted())")
        }
        .font(.footnote)
        .foregroundStyle(.secondary)
    }

    private var commentLine: some View {
        HStack {
            Text(member.comment ?? emptyComment)
                .font(.footnote)
                .lineLimit(1)

            Spacer()

            if let distance = member.distanceInMeters {
                Text(formatDistance(distance))
                    .font(.caption)
                    .layoutPriority(1)
            }
        }
        .foregroundStyle(.secondary)
    }
}



#Preview {
    VStack(spacing: 16) {
        ForEach(Member.previews) { member in
            MemberRow(member: member)
        }
    }
    .padding()
}
