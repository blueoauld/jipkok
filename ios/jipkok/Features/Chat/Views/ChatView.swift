import SwiftUI

private let rowSpacing: CGFloat = 12
private let listTopPadding: CGFloat = 8
private let listBottomPadding: CGFloat = 16

struct ChatView: View {
    
    private enum Filter: CaseIterable {
        case all
        case unread
        
        var label: String {
            switch self {
            case .all: "전체"
            case .unread: "안읽음"
            }
        }
    }
    
    @State private var filter: Filter = .all
    @State private var isNoteReceiveEnabled = true
    @State private var rooms = ChatRoom.samples
    
    private var filteredRooms: [ChatRoom] {
        switch filter {
        case .all: rooms
        case .unread: rooms.filter { $0.unreadCount > 0 }
        }
    }
    
    var body: some View {
        NavigationStack {
            roomList
                .safeAreaInset(edge: .top) {
                    filterPicker
                }
                .navigationTitle("채팅")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("채팅 검색", systemImage: "magnifyingglass") {}
                    }
                    
                    ToolbarItem(placement: .topBarTrailing) {
                        noteReceiveButton
                    }
                }
        }
    }
    
    private var roomList: some View {
        List(filteredRooms) { room in
            ChatRow(room: room)
                .listRowInsets(EdgeInsets(
                    top: rowSpacing / 2,
                    leading: 16,
                    bottom: rowSpacing / 2,
                    trailing: 16
                ))
                .listRowSeparator(.hidden)
                .swipeActions(edge: .leading, allowsFullSwipe: false) {
                    notificationAction(for: room)
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    leaveAction
                }
        }
        .listStyle(.plain)
        .contentMargins(.top, listTopPadding - rowSpacing / 2, for: .scrollContent)
        .contentMargins(.bottom, listBottomPadding - rowSpacing / 2, for: .scrollContent)
    }
    
    private var filterPicker: some View {
        Picker("필터", selection: $filter) {
            ForEach(Filter.allCases, id: \.self) { item in
                Text(item.label)
                    .tag(item)
            }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.bar)
    }
    
    private func notificationAction(for room: ChatRoom) -> some View {
        Button {
        } label: {
            Label(
                room.isNotificationEnabled ? "알림 끄기" : "알림 켜기",
                systemImage: room.isNotificationEnabled ? "bell.slash.fill" : "bell.fill"
            )
            .labelStyle(.iconOnly)
        }
        .tint(.accentColor)
    }
    
    private var leaveAction: some View {
        Button(role: .destructive) {
        } label: {
            Label("나가기", systemImage: "rectangle.portrait.and.arrow.right.fill")
                .labelStyle(.iconOnly)
        }
    }
    
    private var noteReceiveButton: some View {
        Button {
            withAnimation { isNoteReceiveEnabled.toggle() }
        } label: {
            Image(systemName: isNoteReceiveEnabled ? "bell" : "bell.slash")
                .contentTransition(.symbolEffect(.replace))
        }
        .accessibilityLabel(isNoteReceiveEnabled ? "쪽지 받지 않기" : "쪽지 받기")
    }
}

#Preview {
    ChatView()
}
