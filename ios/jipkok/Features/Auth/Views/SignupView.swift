import SwiftUI

struct SignupView: View {

    private enum Field {
        case phoneNumber
        case verificationCode
        case password
        case passwordConfirm
    }

    @State private var viewModel: SignupViewModel

    @State private var webPage: WebPage?

    @FocusState private var focusedField: Field?

    init(session: AuthSession) {
        _viewModel = State(wrappedValue: SignupViewModel(session: session))
    }

    fileprivate init(viewModel: SignupViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }

    var body: some View {
        content
            .navigationTitle("회원가입")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(item: $webPage) { page in
                SafariView(url: page.url)
                    .ignoresSafeArea()
            }
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(viewModel.message ?? "")
            }
    }

    private var content: some View {
        ScrollView {
            VStack {
                phoneNumberRow
                verificationCodeField
                passwordField
                passwordConfirmField
                genderPicker
            }
            .padding()
        }
        .scrollDismissesKeyboard(.interactively)
        .scrollBounceBehavior(.basedOnSize)
        .safeAreaBar(edge: .bottom) {
            bottomBar
        }
    }

    private var phoneNumberRow: some View {
        HStack {
            phoneNumberField
            sendCodeButton
        }
    }

    private var phoneNumberField: some View {
        TextField("휴대폰 번호", text: $viewModel.phoneNumber)
            .keyboardType(.numberPad)
            .textContentType(.telephoneNumber)
            .focused($focusedField, equals: .phoneNumber)
            .onChange(of: viewModel.phoneNumber) { _, _ in viewModel.sanitizePhoneNumber() }
            .inputStyle(isFocused: focusedField == .phoneNumber)
            .contentShape(.rect)
            .onTapGesture { focusedField = .phoneNumber }
    }

    private var sendCodeButton: some View {
        Button("전송") {
            focusedField = nil

            Task { await viewModel.sendCode() }
        }
        .buttonStyle(.action)
        .disabled(!viewModel.canSendCode)
    }

    private var verificationCodeField: some View {
        TextField("인증번호", text: $viewModel.verificationCode)
            .keyboardType(.numberPad)
            .textContentType(.oneTimeCode)
            .focused($focusedField, equals: .verificationCode)
            .onChange(of: viewModel.verificationCode) { _, _ in viewModel.sanitizeVerificationCode() }
            .inputStyle(isFocused: focusedField == .verificationCode)
            .contentShape(.rect)
            .onTapGesture { focusedField = .verificationCode }
    }

    private var passwordField: some View {
        SecureField("비밀번호 (8자 이상)", text: $viewModel.password)
            .textContentType(.newPassword)
            .textInputAutocapitalization(.never)
            .submitLabel(.next)
            .focused($focusedField, equals: .password)
            .onSubmit { focusedField = .passwordConfirm }
            .inputStyle(isFocused: focusedField == .password)
            .contentShape(.rect)
            .onTapGesture { focusedField = .password }
    }

    private var passwordConfirmField: some View {
        SecureField("비밀번호 확인", text: $viewModel.passwordConfirm)
            .textContentType(.newPassword)
            .textInputAutocapitalization(.never)
            .submitLabel(.done)
            .focused($focusedField, equals: .passwordConfirm)
            .onSubmit { focusedField = nil }
            .inputStyle(isFocused: focusedField == .passwordConfirm)
            .contentShape(.rect)
            .onTapGesture { focusedField = .passwordConfirm }
    }

    private var genderPicker: some View {
        HStack {
            ForEach(SignupViewModel.Gender.allCases, id: \.self) { item in
                Button {
                    viewModel.gender = item
                } label: {
                    Text(item.label)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.action(isSelected: viewModel.gender == item))
            }
        }
    }

    private var bottomBar: some View {
        VStack(spacing: 12) {
            submitButton
            legalLinks
        }
        .padding()
    }

    private var submitButton: some View {
        Button(action: submit) {
            if viewModel.isSubmitting {
                ProgressView()
            } else {
                Text("회원가입")
            }
        }
        .buttonStyle(.submit)
        .disabled(!viewModel.canSubmit)
    }

    private var legalLinks: some View {
        HStack(alignment: .center) {
            Button("개인정보 처리방침") { webPage = LegalPage.privacy }
            Text("|")
            Button("서비스 이용약관") { webPage = LegalPage.terms }
        }
        .font(.footnote)
        .buttonStyle(.plain)
        .foregroundStyle(.secondary)
    }

    private func submit() {
        focusedField = nil

        Task { await viewModel.submit() }
    }
}

#Preview("기본") {
    NavigationStack {
        SignupView(session: AuthSession())
    }
}

#Preview("입력 완료") {
    NavigationStack {
        SignupView(
            viewModel: .preview(
                phoneNumber: "01012345678",
                verificationCode: "123456",
                password: "password123",
                passwordConfirm: "password123",
                gender: .male
            )
        )
    }
}

#Preview("가입 중") {
    NavigationStack {
        SignupView(
            viewModel: .preview(
                phoneNumber: "01012345678",
                verificationCode: "123456",
                password: "password123",
                passwordConfirm: "password123",
                gender: .male,
                isSubmitting: true
            )
        )
    }
}
