import SwiftUI

struct MemberAvatar: View {

    let url: URL?
    var size: CGFloat = 64
    var isCircular = false

    private var shape: AnyShape {
        isCircular ? AnyShape(.circle) : AnyShape(.rect(cornerRadius: fieldCornerRadius))
    }

    var body: some View {
        AsyncImage(url: url) { image in
            image
                .resizable()
                .scaledToFill()
        } placeholder: {
            Image(systemName: "person.fill")
                .font(.system(size: size * 0.4))
                .foregroundStyle(.tertiary)
        }
        .frame(width: size, height: size)
        .background(Color(.secondarySystemBackground))
        .clipShape(shape)
    }
}

#Preview {
    HStack {
        MemberAvatar(url: nil)
        MemberAvatar(url: nil, isCircular: true)
        MemberAvatar(url: nil, size: 40)
    }
}
