import SwiftUI

let fieldCornerRadius: CGFloat = 16

extension View {
    
    func inputStyle(isFocused: Bool) -> some View {
        font(.body)
            .fieldBox(background: Color(.secondarySystemBackground))
            .overlay {
                RoundedRectangle(cornerRadius: fieldCornerRadius)
                    .stroke(Color.accentColor, lineWidth: isFocused ? 1 : 0)
            }
    }
    
    func fieldBox(background: Color) -> some View {
        padding()
            .frame(minHeight: 44)
            .background(background, in: .rect(cornerRadius: fieldCornerRadius))
    }
}
