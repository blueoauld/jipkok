import Kingfisher
import SwiftUI

private let bubbleSpacing: CGFloat = 8
private let photoBubbleSize: CGFloat = 220

struct ChatMessageList: View {

    let messages: [ChatMessage]
    let myMemberId: Int?
    let isLoadingMore: Bool
    let onLoadMore: () async -> Void
    let onPhotoTap: (URL) -> Void

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: bubbleSpacing) {
                    if isLoadingMore {
                        ProgressView()
                            .padding(8)
                    }

                    ForEach(messages) { item in
                        ChatMessageBubble(
                            message: item,
                            isMine: item.senderId == myMemberId,
                            onPhotoTap: onPhotoTap
                        )
                        .id(item.id)
                        .task { await loadMoreIfNeeded(for: item) }
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
            }
            .defaultScrollAnchor(.bottom)
            .scrollDismissesKeyboard(.interactively)
            .onChange(of: messages.first?.id) { previousTop, _ in
                guard let previousTop, messages.contains(where: { $0.id == previousTop }) else { return }

                proxy.scrollTo(previousTop, anchor: .top)
            }
            .onChange(of: messages.last?.id) { _, newBottom in
                guard let newBottom else { return }

                withAnimation(.easeOut(duration: 0.2)) {
                    proxy.scrollTo(newBottom, anchor: .bottom)
                }
            }
        }
    }

    private func loadMoreIfNeeded(for item: ChatMessage) async {
        guard item.id == messages.first?.id else { return }

        await onLoadMore()
    }
}

private struct ChatMessageBubble: View {

    let message: ChatMessage
    let isMine: Bool
    let onPhotoTap: (URL) -> Void

    var body: some View {
        HStack(alignment: .bottom, spacing: 6) {
            if isMine {
                Spacer(minLength: 40)
                timeLabel
                bubble
            } else {
                bubble
                timeLabel
                Spacer(minLength: 40)
            }
        }
    }

    private var timeLabel: some View {
        Text(message.createdAt, format: .dateTime.hour().minute())
            .font(.caption2)
            .foregroundStyle(.secondary)
            .layoutPriority(1)
    }

    @ViewBuilder
    private var bubble: some View {
        switch message.content {
        case .text(let text):
            textBubble(text)
        case .photo(let url):
            photoBubble(url)
        }
    }

    private func textBubble(_ text: String) -> some View {
        Text(text)
            .font(.body)
            .foregroundStyle(isMine ? .white : .primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                isMine ? Color.accentColor : Color(.secondarySystemBackground),
                in: .rect(cornerRadius: fieldCornerRadius)
            )
    }

    private func photoBubble(_ url: URL) -> some View {
        Button {
            onPhotoTap(url)
        } label: {
            KFImage(source: .network(KF.ImageResource(downloadURL: url, cacheKey: url.path)))
                .placeholder {
                    Color(.secondarySystemBackground)
                        .overlay { ProgressView() }
                }
                .resizable()
                .scaledToFill()
                .frame(width: photoBubbleSize, height: photoBubbleSize)
                .clipShape(.rect(cornerRadius: fieldCornerRadius))
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("사진")
    }

}

#Preview {
    ChatMessageList(
        messages: ChatMessage.previews,
        myMemberId: 2,
        isLoadingMore: false,
        onLoadMore: {},
        onPhotoTap: { _ in }
    )
}
