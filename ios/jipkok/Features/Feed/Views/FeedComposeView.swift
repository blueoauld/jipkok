import PhotosUI
import SwiftUI

private let photoRatio: CGFloat = 2

struct FeedComposeView: View {
    
    let onSubmitted: () -> Void
    
    @State private var viewModel = FeedComposeViewModel()
    @State private var isPickerPresented = false
    @State private var pickerItems: [PhotosPickerItem] = []
    @State private var isConfirmingClose = false
    @State private var isCameraPresented = false
    
    @FocusState private var isCaptionFocused: Bool
    
    @Environment(\.dismiss) private var dismiss
    
    init(onSubmitted: @escaping () -> Void) {
        self.onSubmitted = onSubmitted
    }
    
    fileprivate init(viewModel: FeedComposeViewModel) {
        self.onSubmitted = {}
        _viewModel = State(wrappedValue: viewModel)
    }
    
    var body: some View {
        content
            .navigationTitle("피드 작성")
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
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {
                    if viewModel.didSubmit {
                        dismiss()
                        onSubmitted()
                    }
                }
            } message: {
                Text(viewModel.message ?? "")
            }
            .alert("알림", isPresented: $isConfirmingClose) {
                Button("닫기", role: .destructive) { dismiss() }
                
                Button("취소", role: .cancel) {}
            } message: {
                Text("작성 중인 내용이 사라집니다.")
            }
            .photosPicker(
                isPresented: $isPickerPresented,
                selection: $pickerItems,
                maxSelectionCount: 1,
                matching: .images
            )
            .onChange(of: pickerItems) { _, items in
                guard !items.isEmpty else { return }
                
                Task { await loadPickedPhoto(items) }
            }
            .fullScreenCover(isPresented: $isCameraPresented) {
                CameraPicker { viewModel.selectPhoto($0) }
                    .ignoresSafeArea()
            }
            .interactiveDismissDisabled(viewModel.isDirty)
    }
    
    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                photoArea
                captionField
            }
            .padding()
        }
        .scrollDismissesKeyboard(.interactively)
        .scrollBounceBehavior(.basedOnSize)
        .safeAreaBar(edge: .bottom) {
            submitButton
                .padding()
        }
    }
    
    @ViewBuilder
    private var photoArea: some View {
        if let photo = viewModel.photo {
            RoundedRectangle(cornerRadius: fieldCornerRadius)
                .fill(Color(.secondarySystemBackground))
                .aspectRatio(photoRatio, contentMode: .fit)
                .overlay {
                    Image(uiImage: photo)
                        .resizable()
                        .scaledToFill()
                }
                .clipShape(.rect(cornerRadius: fieldCornerRadius))
                .overlay(alignment: .topTrailing) {
                    Button {
                        viewModel.removePhoto()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(.white, .red)
                            .padding(6)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("사진 삭제")
                }
        } else {
            HStack(spacing: 8) {
                sourceTile("사진 선택", systemImage: "photo.on.rectangle") { isPickerPresented = true }
                sourceTile("사진 촬영", systemImage: "camera") { presentCamera() }
            }
        }
    }
    
    private func sourceTile(_ title: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            RoundedRectangle(cornerRadius: fieldCornerRadius)
                .fill(Color(.secondarySystemBackground))
                .aspectRatio(1, contentMode: .fit)
                .overlay {
                    VStack(spacing: 8) {
                        Image(systemName: systemImage)
                            .font(.largeTitle)
                        
                        Text(title)
                            .font(.footnote)
                    }
                    .foregroundStyle(.secondary)
                }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
    }
    
    private func presentCamera() {
        guard UIImagePickerController.isSourceTypeAvailable(.camera) else {
            viewModel.message = "카메라를 사용할 수 없습니다."
            
            return
        }
        
        isCameraPresented = true
    }
    
    private var captionField: some View {
        VStack(alignment: .trailing, spacing: 8) {
            TextField("캡션 (선택)", text: $viewModel.caption)
                .focused($isCaptionFocused)
                .onChange(of: viewModel.caption) { _, _ in viewModel.sanitizeCaption() }
                .inputStyle(isFocused: isCaptionFocused)
                .contentShape(.rect)
                .onTapGesture { isCaptionFocused = true }
            
            Text("\(String(viewModel.caption.count)) / \(String(feedCaptionMaxLength))")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }
    
    private var submitButton: some View {
        Button(action: submit) {
            if viewModel.isSubmitting {
                ProgressView()
            } else {
                Text("등록")
            }
        }
        .buttonStyle(.submit)
        .disabled(!viewModel.canSubmit)
    }
    
    private func submit() {
        isCaptionFocused = false
        
        Task { await viewModel.submit() }
    }
    
    private func loadPickedPhoto(_ items: [PhotosPickerItem]) async {
        defer { pickerItems = [] }
        
        guard let item = items.first,
              let data = try? await item.loadTransferable(type: Data.self),
              let image = UIImage(data: data)
        else { return }
        
        viewModel.selectPhoto(image)
    }
}

#Preview("기본") {
    NavigationStack {
        FeedComposeView(onSubmitted: {})
    }
}

#Preview("작성 완료") {
    NavigationStack {
        FeedComposeView(viewModel: .preview(hasPhoto: true, caption: "퇴근길 노을"))
    }
}

#Preview("등록 중") {
    NavigationStack {
        FeedComposeView(viewModel: .preview(hasPhoto: true, isSubmitting: true))
    }
}
