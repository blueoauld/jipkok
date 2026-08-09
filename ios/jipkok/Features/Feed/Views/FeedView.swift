import SwiftUI

struct FeedView: View {

    var body: some View {
        NavigationStack {
            Text("Hello World")
                .navigationTitle("피드")
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    FeedView()
}
