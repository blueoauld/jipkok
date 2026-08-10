import SwiftUI

struct RootView: View {

    @State private var session = AuthSession()

    var body: some View {
        content
            .task { session.restore() }
    }

    @ViewBuilder
    private var content: some View {
        switch session.status {
        case .unknown:
            ProgressView()
        case .authenticated:
            RootTabView(session: session)
        case .unauthenticated:
            LoginView(session: session)
        case .needsSetup:
            NavigationStack {
                SetupView()
            }
        }
    }
}

#Preview {
    RootView()
}
