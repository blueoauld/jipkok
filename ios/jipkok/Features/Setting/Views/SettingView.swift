import SwiftUI

struct SettingView: View {

    var body: some View {
        NavigationStack {
            Text("Hello World")
                .navigationTitle("설정")
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    SettingView()
}
