import SwiftUI

private let bioMaxLength = 1000
private let bioLineCount = 7

struct ProfileEditView: View {

    private enum Field {
        case nickname
        case birthYear
        case bio
    }

    @State private var viewModel = ProfileEditViewModel()

    @FocusState private var focusedField: Field?

    @Environment(\.dismiss) private var dismiss
    
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
            .task { await viewModel.loadIfNeeded() }
    }

    private var content: some View {
        ScrollView {
            VStack {
                nicknameField
                birthYearField
                bioField
            }
            .padding()
        }
        .scrollDismissesKeyboard(.interactively)
        .scrollBounceBehavior(.basedOnSize)
        .safeAreaInset(edge: .bottom) {
            submitButton
                .padding()
        }
    }

    private var nicknameField: some View {
        TextField("닉네임", text: $viewModel.nickname)
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
        TextField("출생연도", text: $viewModel.birthYear)
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

            Text("\(String(viewModel.bio.count)) / \(String(bioMaxLength))")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private var submitButton: some View {
        Button(action: submit) {
            if viewModel.isSubmitting {
                ProgressView()
                    .tint(.primary)
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
}

#Preview {
    NavigationStack {
        ProfileEditView()
    }
}
