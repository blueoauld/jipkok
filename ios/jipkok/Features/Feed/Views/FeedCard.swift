import SwiftUI

private let cardRatio: CGFloat = 2
private let avatarSize: CGFloat = 36
private let gradientHeightRatio: CGFloat = 0.35
private let scrimOpacity: CGFloat = 0.35

struct FeedCard: View {
    
    let post: FeedPost
    
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
                AsyncImage(url: post.imageURL) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    Color.clear
                }
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
        HStack {
            MemberAvatar(url: post.profileImageURL, size: avatarSize, isCircular: true)
            
            Text(post.nickname)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .lineLimit(1)
        }
        .padding()
    }
    
    private var reportButton: some View {
        Button {
        } label: {
            Image(systemName: "light.beacon.max.fill")
                .font(.title3)
                .foregroundStyle(.white)
                .padding()
        }
        .accessibilityLabel("신고")
    }
    
    private var likeButton: some View {
        Button {
        } label: {
            Image(systemName: post.isLiked ? "heart.fill" : "heart")
                .font(.title3)
                .foregroundStyle(.white)
                .padding()
        }
        .accessibilityLabel(post.isLiked ? "좋아요 취소" : "좋아요")
    }
    
    private var slot: some View {
        VStack(spacing: 4) {
            Text(post.slotAt, format: .dateTime.hour(.twoDigits(amPM: .omitted)).minute(.twoDigits))
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
            ForEach(FeedPost.samples.prefix(3)) { post in
                FeedCard(post: post)
            }
        }
        .padding()
    }
}
