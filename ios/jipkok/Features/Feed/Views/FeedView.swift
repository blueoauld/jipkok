import SwiftUI

struct FeedView: View {
    
    private enum Sort: CaseIterable {
        case latest
        case oldest
        
        var label: String {
            switch self {
            case .latest: "최근"
            case .oldest: "과거"
            }
        }
    }
    
    @State private var sort: Sort = .latest
    @State private var date = Date()
    @State private var isPickingDate = false
    @State private var isNotificationEnabled = true
    @State private var genderFilter: GenderFilter = .all
    
    var body: some View {
        NavigationStack {
            postList
                .overlay(alignment: .bottom) {
                    dateButton
                }
                .sheet(isPresented: $isPickingDate) {
                    datePicker
                }
                .safeAreaInset(edge: .top) {
                    sortPicker
                }
                .navigationTitle("피드")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        notificationButton
                    }
                    
                    ToolbarItem(placement: .topBarTrailing) {
                        genderMenu
                    }
                    
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("피드 작성", systemImage: "square.and.pencil") {}
                    }
                }
        }
    }
    
    private var postList: some View {
        ScrollView {
            LazyVStack(spacing: rowSpacing) {
                ForEach(FeedPost.samples) { post in
                    FeedCard(post: post)
                }
            }
            .padding(.horizontal)
            .padding(.top, listTopPadding)
            .padding(.bottom)
        }
    }
    
    private var dateButton: some View {
        Button {
            isPickingDate = true
        } label: {
            Text(dateLabel)
                .font(.body)
                .padding(.horizontal)
                .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
        .glassEffect(.regular.interactive(), in: .capsule)
        .padding(.bottom, listBottomPadding)
    }
    
    private var dateLabel: String {
        Calendar.current.isDateInToday(date)
        ? "오늘"
        : date.formatted(.dateTime.month(.abbreviated).day())
    }
    
    private var datePicker: some View {
        DatePicker("날짜", selection: $date, displayedComponents: .date)
            .datePickerStyle(.graphical)
            .padding()
            .presentationDetents([.medium])
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
    
    private var notificationButton: some View {
        Button {
            withAnimation { isNotificationEnabled.toggle() }
        } label: {
            Image(systemName: isNotificationEnabled ? "bell" : "bell.slash")
                .contentTransition(.symbolEffect(.replace))
        }
        .accessibilityLabel(isNotificationEnabled ? "알림 받지 않기" : "알림 받기")
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
}

#Preview {
    FeedView()
}
