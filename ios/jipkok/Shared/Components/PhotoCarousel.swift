import Kingfisher
import SwiftUI

struct PhotoCarousel: UIViewRepresentable {

    let urls: [URL]
    @Binding var currentIndex: Int
    let onTap: (Int) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(urls: urls, currentIndex: $currentIndex, onTap: onTap)
    }

    func makeUIView(context: Context) -> UICollectionView {
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: PagingCollectionLayout())
        collectionView.isPagingEnabled = true
        collectionView.showsHorizontalScrollIndicator = false
        collectionView.contentInsetAdjustmentBehavior = .never
        collectionView.backgroundColor = .secondarySystemBackground
        collectionView.dataSource = context.coordinator
        collectionView.delegate = context.coordinator
        collectionView.register(CarouselPhotoCell.self, forCellWithReuseIdentifier: CarouselPhotoCell.identifier)

        return collectionView
    }

    func updateUIView(_ collectionView: UICollectionView, context: Context) {
        let coordinator = context.coordinator

        guard coordinator.urls != urls else { return }

        coordinator.urls = urls
        collectionView.reloadData()
    }

    final class Coordinator: NSObject, UICollectionViewDataSource, UICollectionViewDelegate {

        var urls: [URL]
        var currentIndex: Binding<Int>
        let onTap: (Int) -> Void

        private var reportedIndex = 0

        init(urls: [URL], currentIndex: Binding<Int>, onTap: @escaping (Int) -> Void) {
            self.urls = urls
            self.currentIndex = currentIndex
            self.onTap = onTap
        }

        func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
            urls.count
        }

        func collectionView(
            _ collectionView: UICollectionView,
            cellForItemAt indexPath: IndexPath
        ) -> UICollectionViewCell {
            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: CarouselPhotoCell.identifier,
                for: indexPath
            ) as! CarouselPhotoCell
            cell.configure(url: urls[indexPath.item])

            return cell
        }

        func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
            onTap(indexPath.item)
        }

        func scrollViewDidScroll(_ scrollView: UIScrollView) {
            let width = scrollView.bounds.width

            guard width > 0 else { return }

            let page = Int((scrollView.contentOffset.x / width).rounded())

            guard page != reportedIndex, (0..<urls.count).contains(page) else { return }

            reportedIndex = page
            currentIndex.wrappedValue = page
        }
    }
}

private final class CarouselPhotoCell: UICollectionViewCell {

    static let identifier = "CarouselPhotoCell"

    private let imageView = UIImageView()

    override init(frame: CGRect) {
        super.init(frame: frame)

        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.frame = contentView.bounds
        imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        contentView.addSubview(imageView)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("스토리보드에서 만들지 않는다.")
    }

    override func prepareForReuse() {
        super.prepareForReuse()

        imageView.kf.cancelDownloadTask()
        imageView.image = nil
    }

    func configure(url: URL) {
        imageView.contentMode = .scaleAspectFill
        imageView.kf.indicatorType = .activity
        imageView.kf.setImage(
            with: KF.ImageResource(downloadURL: url, cacheKey: url.path),
            options: [
                .transition(.fade(0.2)),
                .onFailureImage(Self.failureImage),
            ]
        ) { [weak self] result in
            if case .failure = result {
                self?.imageView.contentMode = .center
            }
        }
    }

    private static let failureImage = UIImage(
        systemName: "exclamationmark.triangle",
        withConfiguration: UIImage.SymbolConfiguration(pointSize: 40, weight: .regular)
    )?.withTintColor(.gray, renderingMode: .alwaysOriginal)
}

#Preview {
    PhotoCarousel(
        urls: [
            URL(string: "https://picsum.photos/id/237/1200/1200")!,
            URL(string: "https://picsum.photos/id/1015/1200/1200")!,
        ],
        currentIndex: .constant(0),
        onTap: { _ in }
    )
    .aspectRatio(1, contentMode: .fit)
}
