import Kingfisher
import SwiftUI

struct MemberAvatar: View {
    
    let url: URL?
    var size: CGFloat = 64
    var isCircular = false
    
    @Environment(\.displayScale) private var displayScale
    
    private var shape: AnyShape {
        isCircular ? AnyShape(.circle) : AnyShape(.rect(cornerRadius: fieldCornerRadius))
    }
    
    private var source: Source? {
        url.map { .network(KF.ImageResource(downloadURL: $0, cacheKey: $0.path)) }
    }
    
    var body: some View {
        KFImage(source: source)
            .placeholder {
                Image(systemName: "person.fill")
                    .font(.system(size: size * 0.4))
                    .foregroundStyle(.tertiary)
            }
            .setProcessor(DownsamplingImageProcessor(size: CGSize(width: size, height: size)))
            .scaleFactor(displayScale)
            .resizable()
            .scaledToFill()
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
