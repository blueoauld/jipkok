import SwiftUI

struct LoginView: View {

    private enum Field {
        case phoneNumber
        case password
    }

    @State private var viewModel: LoginViewModel

    @FocusState private var focusedField: Field?

    init(session: AuthSession) {
        _viewModel = State(wrappedValue: LoginViewModel(session: session))
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("로그인")
                .navigationBarTitleDisplayMode(.inline)
                .alert("에러", isPresented: $viewModel.isShowingError) {
                    Button("확인", role: .cancel) {}
                } message: {
                    Text(viewModel.errorMessage ?? "")
                }
        }
    }

    private var content: some View {
        ScrollView {
            VStack {
                VStack {
                    phoneNumberField
                    passwordField
                }

                signupLink
                    .padding(.top)
            }
            .padding()
        }
        .scrollDismissesKeyboard(.interactively)
        .scrollBounceBehavior(.basedOnSize)
        .safeAreaInset(edge: .bottom) {
            loginButton
                .padding()
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

    private var passwordField: some View {
        SecureField("비밀번호", text: $viewModel.password)
            .textContentType(.password)
            .textInputAutocapitalization(.never)
            .submitLabel(.go)
            .focused($focusedField, equals: .password)
            .onSubmit(submit)
            .inputStyle(isFocused: focusedField == .password)
            .contentShape(.rect)
            .onTapGesture { focusedField = .password }
    }

    private var signupLink: some View {
        Button("회원가입") {}
            .font(.subheadline)
            .buttonStyle(.plain)
            .foregroundStyle(Color.accentColor)
            .contentShape(.rect)
    }

    private var loginButton: some View {
        Button(action: submit) {
            if viewModel.isSubmitting {
                ProgressView()
                    .tint(.primary)
            } else {
                Text("로그인")
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
    LoginView(session: AuthSession())
}
