import SwiftUI

struct RankView: View {

    @State private var genderFilter: GenderFilter = .all

    var body: some View {
        NavigationStack {
            memberList
                .safeAreaInset(edge: .top) {
                    genderPicker
                }
                .navigationTitle("랭킹")
                .navigationBarTitleDisplayMode(.inline)
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

    private var genderPicker: some View {
        Picker("성별", selection: $genderFilter) {
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
}

#Preview {
    RankView()
}
