import SwiftUI
import UIKit

extension View {

    @ViewBuilder
    func captureProtected(_ isProtected: Bool = true) -> some View {
        if isProtected {
            CaptureProtected { self }
        } else {
            self
        }
    }
}

private struct CaptureProtected<Content: View>: UIViewRepresentable {

    @ViewBuilder let content: Content

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let coordinator = context.coordinator
        coordinator.textField.isSecureTextEntry = true

        guard let canvas = coordinator.textField.subviews.first else { return UIView() }

        let hostingView = coordinator.controller.view!
        hostingView.backgroundColor = .clear
        hostingView.translatesAutoresizingMaskIntoConstraints = false
        canvas.addSubview(hostingView)

        NSLayoutConstraint.activate([
            hostingView.topAnchor.constraint(equalTo: canvas.topAnchor),
            hostingView.bottomAnchor.constraint(equalTo: canvas.bottomAnchor),
            hostingView.leadingAnchor.constraint(equalTo: canvas.leadingAnchor),
            hostingView.trailingAnchor.constraint(equalTo: canvas.trailingAnchor),
        ])

        return canvas
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        context.coordinator.controller.rootView = AnyView(content)
    }

    final class Coordinator {

        let textField = UITextField()
        let controller = UIHostingController(rootView: AnyView(EmptyView()))
    }
}

#Preview {
    Image(systemName: "photo")
        .font(.system(size: 80))
        .frame(width: 300, height: 300)
        .background(Color(.secondarySystemBackground))
        .captureProtected()
}
