import PhotosUI
import SwiftUI

struct ChatRoomView: View {

    private struct ViewingPhoto: Identifiable {

        let url: URL

        var id: URL { url }
    }

    @State private var viewModel: ChatRoomViewModel
    @State private var isPickerPresented = false
    @State private var pickerItems: [PhotosPickerItem] = []
    @State private var viewingPhoto: ViewingPhoto?

    @Environment(\.dismiss) private var dismiss

    init(room: ChatRoom) {
        _viewModel = State(wrappedValue: ChatRoomViewModel(room: room))
    }

    fileprivate init(viewModel: ChatRoomViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }

    var body: some View {
        content
            .navigationTitle(viewModel.room.nickname)
            .navigationBarTitleDisplayMode(.inline)
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(viewModel.message ?? "")
            }
            .alert("알림", isPresented: $viewModel.isRoomDeleted) {
                Button("확인", role: .cancel) { dismiss() }
            } message: {
                Text("삭제된 대화방입니다.")
            }
            .photosPicker(
                isPresented: $isPickerPresented,
                selection: $pickerItems,
                maxSelectionCount: 1,
                matching: .images
            )
            .onChange(of: pickerItems) { _, items in
                guard !items.isEmpty else { return }

                Task { await sendPickedPhoto(items) }
            }
            .fullScreenCover(item: $viewingPhoto) { photo in
                PhotoViewer(urls: [photo.url], index: .constant(0))
            }
            .task { await viewModel.loadIfNeeded() }
            .task { await viewModel.observeSocket() }
    }

    private var content: some View {
        Group {
            switch viewModel.displayState {
            case .loading:
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case .empty:
                ContentUnavailableView("첫 메시지를 보내 보세요.", systemImage: "bubble.left.and.bubble.right")
            case .content:
                ChatMessageList(
                    messages: viewModel.messages,
                    myMemberId: viewModel.myMemberId,
                    isLoadingMore: viewModel.isLoading,
                    onLoadMore: { await viewModel.loadMore() },
                    onPhotoTap: { viewingPhoto = ViewingPhoto(url: $0) }
                )
            }
        }
        .safeAreaBar(edge: .bottom) {
            inputBar
        }
    }

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: 8) {
            Button {
                isPickerPresented = true
            } label: {
                Image(systemName: "plus")
                    .font(.body.weight(.semibold))
                    .frame(width: 36, height: 36)
                    .contentShape(.circle)
            }
            .buttonStyle(.plain)
            .disabled(viewModel.isSending)
            .accessibilityLabel("사진 보내기")

            TextField("메시지 입력", text: $viewModel.draft, axis: .vertical)
                .lineLimit(1...4)
                .onChange(of: viewModel.draft) { _, _ in viewModel.sanitizeDraft() }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.secondarySystemBackground), in: .rect(cornerRadius: fieldCornerRadius))

            Button {
                Task { await viewModel.sendText() }
            } label: {
                if viewModel.isSending {
                    ProgressView()
                        .frame(width: 36, height: 36)
                } else {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title)
                        .frame(width: 36, height: 36)
                        .contentShape(.circle)
                }
            }
            .buttonStyle(.plain)
            .foregroundStyle(viewModel.canSend ? Color.accentColor : Color(.tertiaryLabel))
            .disabled(!viewModel.canSend)
            .accessibilityLabel("보내기")
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    private func sendPickedPhoto(_ items: [PhotosPickerItem]) async {
        defer { pickerItems = [] }

        guard let item = items.first,
              let data = try? await item.loadTransferable(type: Data.self),
              let image = UIImage(data: data)
        else { return }

        await viewModel.sendPhoto(image)
    }
}

#Preview("대화") {
    NavigationStack {
        ChatRoomView(viewModel: .preview(messages: ChatMessage.previews))
    }
}

#Preview("로딩 중") {
    NavigationStack {
        ChatRoomView(viewModel: .preview(isLoading: true))
    }
}

#Preview("빈 방") {
    NavigationStack {
        ChatRoomView(viewModel: .preview())
    }
}
