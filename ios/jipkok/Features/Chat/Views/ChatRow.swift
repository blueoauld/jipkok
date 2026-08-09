import SwiftUI

private let maxUnreadCount = 99

struct ChatRow: View {
    
    let room: ChatRoom
    
    var body: some View {
        HStack(spacing: 12) {
            MemberAvatar(url: room.profileImageURL)
            
            VStack(alignment: .leading, spacing: 4) {
                nameLine
                messageLine
            }
        }
    }
    
    private var nameLine: some View {
        HStack(spacing: 4) {
            Text(room.nickname)
                .font(.body.weight(.semibold))
                .lineLimit(1)
            
            if !room.isNotificationEnabled {
                Image(systemName: "bell.slash.fill")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            
            Spacer()
            
            Text(chatTime(from: room.lastMessageAt))
                .font(.caption)
                .foregroundStyle(.secondary)
                .layoutPriority(1)
        }
    }
    
    private var messageLine: some View {
        HStack {
            Text(room.lastMessage.preview)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(2)
            
            Spacer()
            
            if room.unreadCount > 0 {
                unreadBadge
                    .layoutPriority(1)
            }
        }
    }
    
    private var unreadBadge: some View {
        Text(unreadText(room.unreadCount))
            .font(.caption2.weight(.semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 6)
            .frame(minWidth: 20, minHeight: 20)
            .background(.red, in: .capsule)
    }
}

private func unreadText(_ count: Int) -> String {
    count > maxUnreadCount ? "\(maxUnreadCount)+" : "\(count)"
}

private func chatTime(from date: Date, now: Date = Date()) -> String {
    let calendar = Calendar.current
    
    if calendar.isDateInToday(date) {
        return date.formatted(date: .omitted, time: .shortened)
    }
    
    if calendar.isDateInYesterday(date) {
        return "어제"
    }
    
    if calendar.isDate(date, equalTo: now, toGranularity: .year) {
        return date.formatted(.dateTime.month(.defaultDigits).day())
    }
    
    return date.formatted(date: .numeric, time: .omitted)
}

#Preview {
    List(ChatRoom.samples.prefix(5)) { room in
        ChatRow(room: room)
    }
    .listStyle(.plain)
}
