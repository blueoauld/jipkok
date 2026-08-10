import Kingfisher
import LazyPager
import SwiftUI

private let closeButtonSize: CGFloat = 44

struct PhotoViewer: View {
    
    let urls: [URL]
    @Binding var index: Int
    var isProtected = false
    
    @Environment(\.dismiss) private var dismiss
    
    @State private var isShowingControls = true
    @State private var backgroundOpacity: CGFloat = 1
    @State private var isDismissing = false
    
    var body: some View {
        LazyPager(data: urls, page: $index) { url in
            ViewerPhoto(url: url)
                .captureProtected(isProtected)
        }
        .zoomable(min: 1, max: 3)
        .onDismiss(backgroundOpacity: $backgroundOpacity) {
            isDismissing = true
            
            var transaction = Transaction()
            transaction.disablesAnimations = true
            
            withTransaction(transaction) { dismiss() }
        }
        .onTap { withAnimation(.easeOut(duration: 0.15)) { isShowingControls.toggle() } }
        .background(.black.opacity(backgroundOpacity))
        .background(ClearFullScreenBackground())
        .ignoresSafeArea()
        .overlay(alignment: .top) {
            if isShowingControls {
                controls
                    .opacity(backgroundOpacity)
                    .transition(.opacity)
            }
        }
        .opacity(isDismissing ? 0 : 1)
        .statusBarHidden()
        .onAppear { index = min(index, max(urls.count - 1, 0)) }
    }
    
    private var controls: some View {
        ZStack {
            if urls.count > 1 {
                Text("\(index + 1) / \(urls.count)")
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .glassEffect(.regular, in: .capsule)
            }
            
            HStack {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.body.weight(.semibold))
                        .frame(width: closeButtonSize, height: closeButtonSize)
                        .contentShape(.circle)
                }
                .buttonStyle(.plain)
                .glassEffect(.regular.interactive(), in: .circle)
                .accessibilityLabel("닫기")
                
                Spacer()
            }
        }
        .padding()
    }
}

private struct ViewerPhoto: View {
    
    let url: URL
    
    @State private var didFail = false
    
    var body: some View {
        if didFail {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40))
                .foregroundStyle(.gray)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            KFImage(source: .network(KF.ImageResource(downloadURL: url, cacheKey: url.path)))
                .placeholder {
                    ProgressView()
                        .tint(.white)
                }
                .onFailure { _ in didFail = true }
                .fade(duration: 0.2)
                .resizable()
                .scaledToFit()
        }
    }
}

#Preview("사진") {
    @Previewable @State var index = 0
    
    PhotoViewer(
        urls: [
            URL(string: "https://picsum.photos/id/237/1200/1600")!,
            URL(string: "https://picsum.photos/id/1015/1600/1200")!,
            URL(string: "https://picsum.photos/id/1025/1200/1200")!,
        ],
        index: $index
    )
}

#Preview("로딩 중") {
    PhotoViewer(
        urls: [URL(string: "https://10.255.255.1/loading.jpg")!],
        index: .constant(0)
    )
}

#Preview("실패") {
    PhotoViewer(
        urls: [URL(string: "https://jipkok.invalid/failure.jpg")!],
        index: .constant(0)
    )
}
