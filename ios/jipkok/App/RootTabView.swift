import SwiftUI

struct RootTabView: View {

    var body: some View {
        TabView {
            Tab("메인", systemImage: "house") {
                MainView()
            }

            Tab("채팅", systemImage: "bubble.left") {
                ChatView()
            }

            Tab("피드", systemImage: "flame") {
                FeedView()
            }

            Tab("랭킹", systemImage: "trophy") {
                RankView()
            }

            Tab("설정", systemImage: "gearshape", role: .search) {
                SettingView()
            }
        }
    }
}

#Preview {
    RootTabView()
}
