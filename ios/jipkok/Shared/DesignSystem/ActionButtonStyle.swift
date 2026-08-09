import SwiftUI

struct ActionButtonStyle: ButtonStyle {
    
    var isSelected = true
    
    func makeBody(configuration: Configuration) -> some View {
        Content(configuration: configuration, isSelected: isSelected)
    }
    
    private struct Content: View {
        let configuration: Configuration
        let isSelected: Bool
        
        @Environment(\.isEnabled) private var isEnabled
        
        private var isFilled: Bool {
            isEnabled && isSelected
        }
        
        var body: some View {
            configuration.label
                .font(.body)
                .foregroundStyle(isFilled ? Color.white : Color.secondary)
                .fieldBox(background: isFilled ? .accentColor : Color(.secondarySystemBackground))
                .opacity(configuration.isPressed ? 0.8 : 1)
        }
    }
}

extension ButtonStyle where Self == ActionButtonStyle {
    
    static var action: ActionButtonStyle { ActionButtonStyle() }
    
    static func action(isSelected: Bool) -> ActionButtonStyle {
        ActionButtonStyle(isSelected: isSelected)
    }
}
