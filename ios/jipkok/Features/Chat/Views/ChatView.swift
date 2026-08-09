import SwiftUI

struct ChatView: View {

    var body: some View {
        NavigationStack {
            Text("Hello World")
                .navigationTitle("채팅")
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    ChatView()
}
