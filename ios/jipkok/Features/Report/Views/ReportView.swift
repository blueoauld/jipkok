import PhotosUI
import SwiftUI

private let detailLineCount = 7

struct ReportView: View {

    let nickname: String

    @State private var viewModel: ReportViewModel
    @State private var isPickerPresented = false
    @State private var pickerItems: [PhotosPickerItem] = []
    @State private var isConfirmingClose = false

    @FocusState private var isDetailFocused: Bool

    @Environment(\.dismiss) private var dismiss

    private let isChatReport: Bool

    init(memberId: Int, nickname: String, roomId: Int? = nil) {
        self.nickname = nickname
        self.isChatReport = roomId != nil
        _viewModel = State(wrappedValue: ReportViewModel(memberId: memberId, roomId: roomId))
    }

    fileprivate init(nickname: String, viewModel: ReportViewModel) {
        self.nickname = nickname
        self.isChatReport = false
        _viewModel = State(wrappedValue: viewModel)
    }

    private var title: String {
        (isChatReport ? "채팅 신고" : "신고") + " (\(nickname))"
    }

    var body: some View {
        content
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기", systemImage: "xmark") {
                        if viewModel.isDirty {
                            isConfirmingClose = true
                        } else {
                            dismiss()
                        }
                    }
                }
            }
            .alert("알림", isPresented: $isConfirmingClose) {
                Button("닫기", role: .destructive) { dismiss() }

                Button("취소", role: .cancel) {}
            } message: {
                Text("작성 중인 내용이 사라집니다.")
            }
            .interactiveDismissDisabled(viewModel.isDirty)
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {
                    if viewModel.didSubmit { dismiss() }
                }
            } message: {
                Text(viewModel.message ?? "")
            }
            .photosPicker(
                isPresented: $isPickerPresented,
                selection: $pickerItems,
                maxSelectionCount: reportPhotoMaxCount - viewModel.photos.count,
                matching: .images
            )
            .onChange(of: pickerItems) { _, items in
                guard !items.isEmpty else { return }

                Task { await addPickedPhotos(items) }
            }
            .loadingOverlay(viewModel.isProcessing)
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                photoSection
                reasonList
                detailSection
            }
            .padding()
        }
        .scrollDismissesKeyboard(.interactively)
        .scrollIndicators(.hidden)
        .safeAreaBar(edge: .bottom) {
            submitButton
                .padding()
        }
    }

    private var photoSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionTitle("증거 사진")

            LazyVGrid(columns: Array(repeating: GridItem(spacing: 8), count: 3), spacing: 8) {
                ForEach(viewModel.photos) { photo in
                    photoTile(photo)
                }

                if viewModel.canAddPhoto {
                    addPhotoButton
                }
            }
        }
    }

    private func photoTile(_ photo: ReportPhoto) -> some View {
        RoundedRectangle(cornerRadius: fieldCornerRadius)
            .fill(Color(.secondarySystemBackground))
            .aspectRatio(1, contentMode: .fit)
            .overlay {
                Image(uiImage: photo.image)
                    .resizable()
                    .scaledToFill()
            }
            .clipShape(.rect(cornerRadius: fieldCornerRadius))
            .overlay(alignment: .topTrailing) {
                Button {
                    viewModel.removePhoto(photo)
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title3)
                        .foregroundStyle(.white, .red)
                        .padding(6)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("사진 삭제")
            }
    }

    private var addPhotoButton: some View {
        Button {
            isPickerPresented = true
        } label: {
            RoundedRectangle(cornerRadius: fieldCornerRadius)
                .fill(Color(.secondarySystemBackground))
                .aspectRatio(1, contentMode: .fit)
                .overlay {
                    Image(systemName: "plus")
                        .font(.title2)
                        .foregroundStyle(.secondary)
                }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("사진 추가")
    }

    private var reasonList: some View {
        VStack(spacing: 0) {
            ForEach(ReportReason.allCases, id: \.self) { item in
                reasonRow(item)
            }
        }
        .background(Color(.secondarySystemBackground), in: .rect(cornerRadius: fieldCornerRadius))
    }

    private func reasonRow(_ item: ReportReason) -> some View {
        Button {
            viewModel.reason = item
        } label: {
            HStack {
                Text(item.label)
                    .lineLimit(1)

                Spacer()

                Image(systemName: "checkmark")
                    .font(.subheadline.weight(.bold))
                    .opacity(viewModel.reason == item ? 1 : 0)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
    }

    private var detailSection: some View {
        VStack(alignment: .trailing, spacing: 8) {
            TextField("상세 내용", text: $viewModel.detail, axis: .vertical)
                .lineLimit(detailLineCount, reservesSpace: true)
                .focused($isDetailFocused)
                .onChange(of: viewModel.detail) { _, _ in viewModel.sanitizeDetail() }
                .inputStyle(isFocused: isDetailFocused)
                .contentShape(.rect)
                .onTapGesture { isDetailFocused = true }

            Text("\(String(viewModel.detail.count)) / \(String(reportDetailMaxLength))")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.secondary)
    }

    private var submitButton: some View {
        Button(action: submit) {
            if viewModel.isSubmitting {
                ProgressView()
            } else {
                Text("신고하기")
            }
        }
        .buttonStyle(.submit(color: .red))
        .disabled(!viewModel.canSubmit)
    }

    private func submit() {
        isDetailFocused = false

        Task { await viewModel.submit() }
    }

    private func addPickedPhotos(_ items: [PhotosPickerItem]) async {
        defer { pickerItems = [] }

        var images: [UIImage] = []

        for item in items {
            guard let data = try? await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: data)
            else { continue }

            images.append(image)
        }

        await viewModel.addPhotos(images)
    }
}

#Preview("기본") {
    NavigationStack {
        ReportView(memberId: 1, nickname: "달리는고양이")
    }
}

#Preview("작성 완료") {
    NavigationStack {
        ReportView(
            nickname: "달리는고양이",
            viewModel: .preview(
                reason: .abuse,
                detail: "채팅에서 욕설을 반복했습니다.",
                photoCount: 2
            )
        )
    }
}

#Preview("제출 중") {
    NavigationStack {
        ReportView(
            nickname: "달리는고양이",
            viewModel: .preview(reason: .abuse, isSubmitting: true)
        )
    }
}
