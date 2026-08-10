import Kingfisher
import SwiftUI

private let closeButtonSize: CGFloat = 44

struct PhotoViewer: View {
    
    let urls: [URL]
    @Binding var index: Int
    
    @Environment(\.dismiss) private var dismiss
    
    @State private var isShowingControls = true
    
    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()
            
            PhotoPager(
                urls: urls,
                startIndex: index,
                currentIndex: $index,
                onTap: { withAnimation(.easeOut(duration: 0.15)) { isShowingControls.toggle() } },
                onDismiss: { dismiss() }
            )
            .ignoresSafeArea()
        }
        .overlay(alignment: .top) {
            if isShowingControls {
                controls
                    .transition(.opacity)
            }
        }
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
                    .glassEffect(.clear, in: .capsule)
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
        .foregroundStyle(.white)
        .padding()
    }
}

private struct PhotoPager: UIViewRepresentable {
    
    let urls: [URL]
    let startIndex: Int
    @Binding var currentIndex: Int
    let onTap: () -> Void
    let onDismiss: () -> Void
    
    func makeCoordinator() -> Coordinator {
        Coordinator(
            urls: urls,
            currentIndex: $currentIndex,
            onTap: onTap,
            onDismiss: onDismiss
        )
    }
    
    func makeUIView(context: Context) -> UICollectionView {
        let collectionView = PagerCollectionView(frame: .zero, collectionViewLayout: PagingCollectionLayout())
        collectionView.isPagingEnabled = true
        collectionView.showsHorizontalScrollIndicator = false
        collectionView.contentInsetAdjustmentBehavior = .never
        collectionView.backgroundColor = .clear
        collectionView.dataSource = context.coordinator
        collectionView.delegate = context.coordinator
        collectionView.register(ZoomablePhotoCell.self, forCellWithReuseIdentifier: ZoomablePhotoCell.identifier)
        
        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleDismissPan))
        pan.delegate = context.coordinator
        collectionView.addGestureRecognizer(pan)
        
        let startIndex = min(startIndex, urls.count - 1)
        
        if startIndex > 0 {
            collectionView.pendingStartIndex = startIndex
            context.coordinator.reportedIndex = startIndex
        }
        
        return collectionView
    }
    
    func updateUIView(_ collectionView: UICollectionView, context: Context) {}
    
    final class Coordinator: NSObject, UICollectionViewDataSource, UICollectionViewDelegate, UIGestureRecognizerDelegate {
        
        private static let dismissTranslation: CGFloat = 100
        
        let urls: [URL]
        var currentIndex: Binding<Int>
        let onTap: () -> Void
        let onDismiss: () -> Void
        
        var reportedIndex = 0
        
        init(urls: [URL], currentIndex: Binding<Int>, onTap: @escaping () -> Void, onDismiss: @escaping () -> Void) {
            self.urls = urls
            self.currentIndex = currentIndex
            self.onTap = onTap
            self.onDismiss = onDismiss
        }
        
        func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
            urls.count
        }
        
        func collectionView(
            _ collectionView: UICollectionView,
            cellForItemAt indexPath: IndexPath
        ) -> UICollectionViewCell {
            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: ZoomablePhotoCell.identifier,
                for: indexPath
            ) as! ZoomablePhotoCell
            cell.onTap = onTap
            cell.configure(url: urls[indexPath.item])
            
            return cell
        }
        
        func scrollViewDidScroll(_ scrollView: UIScrollView) {
            let width = scrollView.bounds.width
            
            guard width > 0 else { return }
            
            let page = Int((scrollView.contentOffset.x / width).rounded())
            
            guard page != reportedIndex, (0..<urls.count).contains(page) else { return }
            
            reportedIndex = page
            currentIndex.wrappedValue = page
        }
        
        @objc func handleDismissPan(_ recognizer: UIPanGestureRecognizer) {
            guard recognizer.state == .ended, let view = recognizer.view else { return }
            
            let translation = recognizer.translation(in: view)
            let velocity = recognizer.velocity(in: view)
            
            if translation.y > Self.dismissTranslation, velocity.y > 0 {
                onDismiss()
            }
        }
        
        func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
            guard let pan = gestureRecognizer as? UIPanGestureRecognizer,
                  let collectionView = pan.view as? UICollectionView
            else { return true }
            
            guard let cell = collectionView.visibleCells.first as? ZoomablePhotoCell, !cell.isZoomed else {
                return false
            }
            
            let velocity = pan.velocity(in: collectionView)
            
            return abs(velocity.y) > abs(velocity.x) * 1.5
        }
        
        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
        ) -> Bool {
            true
        }
    }
}


private final class PagerCollectionView: UICollectionView {
    
    var pendingStartIndex: Int?
    
    override func layoutSubviews() {
        super.layoutSubviews()
        
        guard let index = pendingStartIndex, bounds.width > 0 else { return }
        
        pendingStartIndex = nil
        setContentOffset(CGPoint(x: CGFloat(index) * bounds.width, y: 0), animated: false)
    }
}

private final class ZoomablePhotoCell: UICollectionViewCell, UIScrollViewDelegate {
    
    static let identifier = "ZoomablePhotoCell"
    
    var onTap: (() -> Void)?
    
    private let scrollView = UIScrollView()
    private let imageView = UIImageView()
    
    var isZoomed: Bool {
        scrollView.zoomScale > scrollView.minimumZoomScale
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        
        scrollView.minimumZoomScale = 1
        scrollView.maximumZoomScale = 3
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.contentInsetAdjustmentBehavior = .never
        scrollView.delegate = self
        contentView.addSubview(scrollView)
        
        imageView.contentMode = .scaleAspectFit
        scrollView.addSubview(imageView)
        
        let doubleTap = UITapGestureRecognizer(target: self, action: #selector(handleDoubleTap))
        doubleTap.numberOfTapsRequired = 2
        scrollView.addGestureRecognizer(doubleTap)
        
        let singleTap = UITapGestureRecognizer(target: self, action: #selector(handleSingleTap))
        singleTap.require(toFail: doubleTap)
        scrollView.addGestureRecognizer(singleTap)
    }
    
    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("스토리보드에서 만들지 않는다.")
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        
        guard scrollView.frame != contentView.bounds else { return }
        
        scrollView.frame = contentView.bounds
        scrollView.zoomScale = scrollView.minimumZoomScale
        layoutImage()
    }
    
    override func prepareForReuse() {
        super.prepareForReuse()
        
        imageView.kf.cancelDownloadTask()
        imageView.image = nil
        scrollView.zoomScale = scrollView.minimumZoomScale
    }
    
    func configure(url: URL) {
        scrollView.zoomScale = scrollView.minimumZoomScale
        imageView.contentMode = .scaleAspectFit
        layoutImage()
        imageView.kf.indicatorType = .activity
        (imageView.kf.indicator?.view as? UIActivityIndicatorView)?.color = .white
        imageView.kf.setImage(
            with: KF.ImageResource(downloadURL: url, cacheKey: url.path),
            options: [
                .transition(.fade(0.2)),
                .onFailureImage(Self.failureImage),
            ]
        ) { [weak self] result in
            guard let self else { return }
            
            if case .failure = result {
                imageView.contentMode = .center
            }
            
            layoutImage()
        }
    }
    
    private func layoutImage() {
        guard let image = imageView.image,
              imageView.contentMode == .scaleAspectFit,
              image.size.width > 0, image.size.height > 0,
              scrollView.bounds.width > 0, scrollView.bounds.height > 0
        else {
            imageView.frame = scrollView.bounds
            scrollView.contentSize = scrollView.bounds.size
            scrollView.contentInset = .zero
            return
        }
        
        let ratio = min(scrollView.bounds.width / image.size.width, scrollView.bounds.height / image.size.height)
        
        imageView.frame = CGRect(
            origin: .zero,
            size: CGSize(width: image.size.width * ratio, height: image.size.height * ratio)
        )
        scrollView.contentSize = imageView.frame.size
        centerImage()
    }
    
    private func centerImage() {
        let horizontal = max(0, (scrollView.bounds.width - scrollView.contentSize.width) / 2)
        let vertical = max(0, (scrollView.bounds.height - scrollView.contentSize.height) / 2)
        
        scrollView.contentInset = UIEdgeInsets(top: vertical, left: horizontal, bottom: vertical, right: horizontal)
    }
    
    private static let failureImage = UIImage(
        systemName: "exclamationmark.triangle",
        withConfiguration: UIImage.SymbolConfiguration(pointSize: 40, weight: .regular)
    )?.withTintColor(.gray, renderingMode: .alwaysOriginal)
    
    func viewForZooming(in scrollView: UIScrollView) -> UIView? {
        imageView
    }
    
    func scrollViewDidZoom(_ scrollView: UIScrollView) {
        centerImage()
    }
    
    @objc private func handleDoubleTap(_ recognizer: UITapGestureRecognizer) {
        if isZoomed {
            scrollView.setZoomScale(scrollView.minimumZoomScale, animated: true)
            return
        }
        
        let scale = scrollView.maximumZoomScale
        let size = CGSize(width: scrollView.bounds.width / scale, height: scrollView.bounds.height / scale)
        let point = recognizer.location(in: imageView)
        let origin = CGPoint(x: point.x - size.width / 2, y: point.y - size.height / 2)
        scrollView.zoom(to: CGRect(origin: origin, size: size), animated: true)
    }
    
    @objc private func handleSingleTap() {
        onTap?()
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
