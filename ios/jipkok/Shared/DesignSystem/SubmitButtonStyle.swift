import SwiftUI

struct SubmitButtonStyle: ButtonStyle {
    
    func makeBody(configuration: Configuration) -> some View {
        Content(configuration: configuration)
    }
    
    private struct Content: View {
        let configuration: Configuration
        
        @Environment(\.isEnabled) private var isEnabled
        
        var body: some View {
            configuration.label
                .font(.headline)
                .foregroundStyle(isEnabled ? Color.white : Color.secondary)
                .frame(maxWidth: .infinity)
                .fieldBox(background: isEnabled ? .accentColor : Color(.secondarySystemBackground))
                .opacity(configuration.isPressed ? 0.8 : 1)
        }
    }
}

extension ButtonStyle where Self == SubmitButtonStyle {
    
    static var submit: SubmitButtonStyle { SubmitButtonStyle() }
}
