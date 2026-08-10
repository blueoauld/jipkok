import Kingfisher
import PhotosUI
import SwiftUI

private let bioLineCount = 7

struct ProfileEditView: View {
    
    private enum Field {
        case nickname
        case birthYear
        case bio
    }
    
    @State private var viewModel = ProfileEditViewModel()
    @State private var pickerVisibility: PhotoVisibility = .public
    @State private var isPickerPresented = false
    @State private var pickerItems: [PhotosPickerItem] = []
    
    @FocusState private var focusedField: Field?
    
    @Environment(\.dismiss) private var dismiss
    
    init() {}
    
    fileprivate init(viewModel: ProfileEditViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }
    
    var body: some View {
        content
            .navigationTitle("프로필 편집")
            .navigationBarTitleDisplayMode(.inline)
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {
                    if viewModel.didSave { dismiss() }
                }
            } message: {
                Text(viewModel.message ?? "")
            }
            .photosPicker(
                isPresented: $isPickerPresented,
                selection: $pickerItems,
                maxSelectionCount: profilePhotoMaxCount - viewModel.photos(for: pickerVisibility).count,
                matching: .images
            )
            .onChange(of: pickerItems) { _, items in
                guard !items.isEmpty else { return }
                
                Task { await addPickedPhotos(items) }
            }
            .loadingOverlay(viewModel.isProcessing)
            .task { await viewModel.loadIfNeeded() }
    }
    
    private var content: some View {
        ScrollView {
            switch viewModel.displayState {
            case .loading:
                ProgressView()
                    .containerRelativeFrame([.horizontal, .vertical])
            case .empty:
                ContentUnavailableView("프로필을 불러오지 못했습니다.", systemImage: "person.slash")
                    .containerRelativeFrame([.horizontal, .vertical])
            case .content:
                VStack(spacing: 16) {
                    photoSection("공개 사진", visibility: .public)
                    photoSection("비밀 사진", visibility: .secret)
                    
                    VStack {
                        nicknameField
                        birthYearField
                        bioField
                    }
                }
                .padding()
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .scrollBounceBehavior(.basedOnSize)
        .safeAreaBar(edge: .bottom) {
            submitButton
                .padding()
        }
    }
    
    private var nicknameField: some View {
        TextField("닉네임 (2자 ~ 10자)", text: $viewModel.nickname)
            .textContentType(.nickname)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .submitLabel(.next)
            .focused($focusedField, equals: .nickname)
            .onSubmit { focusedField = .birthYear }
            .onChange(of: viewModel.nickname) { _, _ in viewModel.sanitizeNickname() }
            .inputStyle(isFocused: focusedField == .nickname)
            .contentShape(.rect)
            .onTapGesture { focusedField = .nickname }
    }
    
    private var birthYearField: some View {
        TextField("출생연도 (YYYY)", text: $viewModel.birthYear)
            .keyboardType(.numberPad)
            .focused($focusedField, equals: .birthYear)
            .onChange(of: viewModel.birthYear) { _, _ in viewModel.sanitizeBirthYear() }
            .inputStyle(isFocused: focusedField == .birthYear)
            .contentShape(.rect)
            .onTapGesture { focusedField = .birthYear }
    }
    
    private var bioField: some View {
        VStack(alignment: .trailing, spacing: 8) {
            TextField("자기소개", text: $viewModel.bio, axis: .vertical)
                .lineLimit(bioLineCount, reservesSpace: true)
                .focused($focusedField, equals: .bio)
                .onChange(of: viewModel.bio) { _, _ in viewModel.sanitizeBio() }
                .inputStyle(isFocused: focusedField == .bio)
                .contentShape(.rect)
                .onTapGesture { focusedField = .bio }
            
            Text("\(String(viewModel.bio.count)) / \(String(Bio.maxLength))")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }
    
    private var submitButton: some View {
        Button(action: submit) {
            if viewModel.isSubmitting {
                ProgressView()
            } else {
                Text("저장")
            }
        }
        .buttonStyle(.submit)
        .disabled(!viewModel.canSubmit)
    }
    
    private func submit() {
        focusedField = nil
        
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
        
        await viewModel.addPhotos(images, visibility: pickerVisibility)
    }
    
    private func photoSection(_ title: String, visibility: PhotoVisibility) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
            
            LazyVGrid(columns: Array(repeating: GridItem(spacing: 8), count: 3), spacing: 8) {
                let photos = viewModel.photos(for: visibility)
                
                ForEach(Array(photos.enumerated()), id: \.offset) { index, photo in
                    photoTile(photo, visibility: visibility)
                        .overlay(alignment: .bottomLeading) {
                            moveButton(direction: -1, photo: photo, visibility: visibility)
                                .disabled(index == 0)
                        }
                        .overlay(alignment: .bottomTrailing) {
                            moveButton(direction: 1, photo: photo, visibility: visibility)
                                .disabled(index == photos.count - 1)
                        }
                }
                
                if viewModel.canAddPhoto(for: visibility) {
                    addPhotoButton(visibility: visibility)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    private func photoTile(_ photo: EditablePhoto, visibility: PhotoVisibility) -> some View {
        RoundedRectangle(cornerRadius: fieldCornerRadius)
            .fill(Color(.secondarySystemBackground))
            .aspectRatio(1, contentMode: .fit)
            .overlay {
                tileImage(photo)
            }
            .clipShape(.rect(cornerRadius: fieldCornerRadius))
            .overlay(alignment: .topTrailing) {
                Button {
                    viewModel.removePhoto(photo, visibility: visibility)
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
    
    @ViewBuilder
    private func tileImage(_ photo: EditablePhoto) -> some View {
        switch photo.source {
        case .remote(let url):
            KFImage(source: .network(KF.ImageResource(downloadURL: url, cacheKey: url.path)))
                .resizable()
                .scaledToFill()
        case .local(let image):
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
        }
    }
    
    private func moveButton(direction: Int, photo: EditablePhoto, visibility: PhotoVisibility) -> some View {
        MoveButton(direction: direction) {
            viewModel.movePhoto(photo, by: direction, visibility: visibility)
        }
    }
    
    private func addPhotoButton(visibility: PhotoVisibility) -> some View {
        Button {
            pickerVisibility = visibility
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
}

private struct MoveButton: View {
    
    let direction: Int
    let action: () -> Void
    
    @Environment(\.isEnabled) private var isEnabled
    
    var body: some View {
        Button(action: action) {
            Image(systemName: direction < 0 ? "chevron.left" : "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white.opacity(isEnabled ? 1 : 0.35))
                .padding(6)
                .background(.black, in: .circle)
                .padding(6)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(direction < 0 ? "앞으로 이동" : "뒤로 이동")
    }
}

#Preview("편집") {
    NavigationStack {
        ProfileEditView(viewModel: .preview(profile: .preview))
    }
}

#Preview("업로드 중") {
    NavigationStack {
        ProfileEditView(viewModel: .preview(profile: .preview, isProcessing: true))
    }
}

#Preview("로딩 중") {
    NavigationStack {
        ProfileEditView(viewModel: .preview(isLoading: true))
    }
}

#Preview("불러오기 실패") {
    NavigationStack {
        ProfileEditView(viewModel: .preview())
    }
}
