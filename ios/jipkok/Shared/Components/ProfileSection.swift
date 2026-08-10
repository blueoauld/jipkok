import SwiftUI

struct ProfileSection: View {
    
    private let title: String
    private let content: String?
    private let placeholder: String
    
    init(_ title: String, body: String?, placeholder: String) {
        self.title = title
        self.content = body
        self.placeholder = placeholder
    }
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(title)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
            
            Text(content ?? placeholder)
                .font(.body)
                .foregroundStyle(content == nil ? .secondary : .primary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color(.secondarySystemBackground), in: .rect(cornerRadius: fieldCornerRadius))
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        ProfileSection("코멘트", body: "오늘 저녁에 같이 러닝하실 분 구해요", placeholder: "코멘트가 없습니다.")
        ProfileSection("자기소개", body: nil, placeholder: "자기소개가 없습니다.")
    }
    .padding()
}
