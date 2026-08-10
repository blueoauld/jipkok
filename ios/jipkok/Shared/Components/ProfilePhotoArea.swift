import SwiftUI

private let dotSize: CGFloat = 7
private let dotSpacing: CGFloat = 6

struct ProfilePhotoArea: View {
    
    let urls: [URL]
    @Binding var index: Int
    let onTap: (Int) -> Void
    
    var body: some View {
        if urls.isEmpty {
            Color(.secondarySystemBackground)
                .aspectRatio(1, contentMode: .fit)
                .overlay {
                    Image(systemName: "photo")
                        .font(.largeTitle)
                        .foregroundStyle(.tertiary)
                }
        } else {
            PhotoCarousel(urls: urls, currentIndex: $index, onTap: onTap)
                .aspectRatio(1, contentMode: .fit)
                .overlay(alignment: .bottom) {
                    pageIndicator
                }
        }
    }
    
    @ViewBuilder
    private var pageIndicator: some View {
        if urls.count > 1 {
            HStack(spacing: dotSpacing) {
                ForEach(urls.indices, id: \.self) { item in
                    Circle()
                        .fill(.white)
                        .opacity(item == index ? 1 : 0.4)
                        .frame(width: dotSize, height: dotSize)
                }
            }
            .padding(12)
            .animation(.easeOut(duration: 0.15), value: index)
        }
    }
}

#Preview("사진") {
    ProfilePhotoArea(
        urls: [
            URL(string: "https://picsum.photos/id/237/1200/1200")!,
            URL(string: "https://picsum.photos/id/1015/1200/1200")!,
        ],
        index: .constant(0),
        onTap: { _ in }
    )
}

#Preview("사진 없음") {
    ProfilePhotoArea(urls: [], index: .constant(0), onTap: { _ in })
}
