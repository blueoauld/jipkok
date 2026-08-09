import SwiftUI

struct RankView: View {

    var body: some View {
        NavigationStack {
            Text("Hello World")
                .navigationTitle("랭킹")
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    RankView()
}
