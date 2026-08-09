import SwiftUI

struct MainView: View {

    var body: some View {
        NavigationStack {
            Text("Hello World")
                .navigationTitle("메인")
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    MainView()
}
