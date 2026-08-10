import SwiftUI

struct SubmitButtonStyle: ButtonStyle {

    var color: Color = .accentColor

    func makeBody(configuration: Configuration) -> some View {
        Content(configuration: configuration, color: color)
    }

    private struct Content: View {
        let configuration: Configuration
        let color: Color

        @Environment(\.isEnabled) private var isEnabled

        var body: some View {
            configuration.label
                .font(.headline)
                .foregroundStyle(isEnabled ? Color.white : Color.secondary)
                .frame(maxWidth: .infinity)
                .fieldBox(background: isEnabled ? color : Color(.secondarySystemBackground))
                .opacity(configuration.isPressed ? 0.8 : 1)
        }
    }
}

extension ButtonStyle where Self == SubmitButtonStyle {

    static var submit: SubmitButtonStyle { SubmitButtonStyle() }

    static func submit(color: Color) -> SubmitButtonStyle {
        SubmitButtonStyle(color: color)
    }
}
