import Kingfisher
import SwiftUI

private let cardRatio: CGFloat = 2
private let avatarSize: CGFloat = 36
private let gradientHeightRatio: CGFloat = 0.35
private let scrimOpacity: CGFloat = 0.35

struct FeedCard: View {
    
    let post: FeedPost
    let onAuthorTap: () -> Void
    let onLike: () -> Void
    let onReport: () -> Void
    
    var body: some View {
        photo
            .aspectRatio(cardRatio, contentMode: .fit)
            .overlay(alignment: .top) { scrim(startingAt: .top) }
            .overlay(alignment: .bottom) { scrim(startingAt: .bottom) }
            .overlay(alignment: .topLeading) { author }
            .overlay(alignment: .topTrailing) { reportButton }
            .overlay(alignment: .bottomTrailing) { likeButton }
            .overlay { slot }
            .clipShape(.rect(cornerRadius: fieldCornerRadius))
    }
    
    private var photo: some View {
        Color(.secondarySystemBackground)
            .overlay {
                KFImage(source: .network(KF.ImageResource(downloadURL: post.imageURL, cacheKey: post.imageURL.path)))
                    .resizable()
                    .scaledToFill()
                    .allowsHitTesting(false)
            }
            .clipped()
    }
    
    private func scrim(startingAt edge: Alignment) -> some View {
        GeometryReader { proxy in
            LinearGradient(
                colors: [.black.opacity(scrimOpacity), .clear],
                startPoint: edge == .top ? .top : .bottom,
                endPoint: edge == .top ? .bottom : .top
            )
            .frame(height: proxy.size.height * gradientHeightRatio)
            .frame(maxHeight: .infinity, alignment: edge)
        }
        .allowsHitTesting(false)
    }
    
    private var author: some View {
        Button(action: onAuthorTap) {
            HStack {
                MemberAvatar(url: post.profileImageURL, size: avatarSize, isCircular: true)
                
                Text(post.nickname)
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                    .lineLimit(1)
            }
            .padding()
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(post.nickname) 프로필")
    }
    
    private var reportButton: some View {
        Button(action: onReport) {
            Image(systemName: "light.beacon.max.fill")
                .font(.title3)
                .foregroundStyle(.white)
                .padding()
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("신고")
    }
    
    private var likeButton: some View {
        Button(action: onLike) {
            Image(systemName: post.isLiked ? "heart.fill" : "heart")
                .font(.title3)
                .foregroundStyle(.white)
                .padding()
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(post.isLiked ? "좋아요 취소" : "좋아요")
    }
    
    private var slot: some View {
        VStack {
            Text(post.slotAt, format: .dateTime.hour().minute())
                .font(.largeTitle.weight(.heavy))
            
            if let caption = post.caption {
                Text(caption)
                    .font(.headline)
                    .lineLimit(1)
            }
        }
        .foregroundStyle(.white)
        .padding(.horizontal)
        .allowsHitTesting(false)
    }
}

#Preview {
    ScrollView {
        LazyVStack(spacing: rowSpacing) {
            ForEach(FeedPost.previews) { post in
                FeedCard(post: post, onAuthorTap: {}, onLike: {}, onReport: {})
            }
        }
        .padding()
    }
}
