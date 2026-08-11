import SwiftUI

struct RootTabView: View {

    let session: AuthSession

    @Environment(\.scenePhase) private var scenePhase

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
                SettingView(session: session)
            }
        }
        .onAppear { ChatSocket.shared.activate() }
        .onDisappear { ChatSocket.shared.deactivate() }
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .active: ChatSocket.shared.activate()
            case .background: ChatSocket.shared.deactivate()
            default: break
            }
        }
    }
}

#Preview {
    RootTabView(session: AuthSession())
}
