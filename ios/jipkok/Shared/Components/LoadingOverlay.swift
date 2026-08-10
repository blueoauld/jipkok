import SwiftUI

private let overlayOpacity: CGFloat = 0.6

extension View {

    func loadingOverlay(_ isLoading: Bool) -> some View {
        overlay {
            if isLoading {
                ZStack {
                    Color(.systemBackground)
                        .opacity(overlayOpacity)

                    ProgressView()
                }
                .ignoresSafeArea()
            }
        }
        .animation(.easeOut(duration: 0.15), value: isLoading)
    }
}

#Preview {
    Text("내용")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .loadingOverlay(true)
}
