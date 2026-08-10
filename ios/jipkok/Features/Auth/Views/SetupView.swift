import SwiftUI

private let bioLineCount = 7

struct SetupView: View {

    private enum Field {
        case nickname
        case birthYear
        case bio
    }

    @State private var viewModel: SetupViewModel

    @FocusState private var focusedField: Field?

    init(session: AuthSession) {
        _viewModel = State(wrappedValue: SetupViewModel(session: session))
    }

    fileprivate init(viewModel: SetupViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }

    var body: some View {
        content
            .navigationTitle("프로필 설정")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden()
            .alert("알림", isPresented: $viewModel.isShowingError) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
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
                Text("들어가기")
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

#Preview("기본") {
    NavigationStack {
        SetupView(session: AuthSession())
    }
}

#Preview("입력 완료") {
    NavigationStack {
        SetupView(
            viewModel: .preview(
                nickname: "철수",
                birthYear: "1998",
                bio: "안녕하세요."
            )
        )
    }
}

#Preview("제출 중") {
    NavigationStack {
        SetupView(
            viewModel: .preview(
                nickname: "철수",
                birthYear: "1998",
                bio: "안녕하세요.",
                isSubmitting: true
            )
        )
    }
}
