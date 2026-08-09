import SwiftUI

struct LoginView: View {

    private enum Field {
        case phoneNumber
        case password
    }

    @State private var phoneNumber = ""
    @State private var password = ""

    @FocusState private var focusedField: Field?

    private var canSubmit: Bool {
        !phoneNumber.isEmpty && !password.isEmpty
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("로그인")
                .navigationBarTitleDisplayMode(.inline)
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
        TextField("휴대폰 번호", text: $phoneNumber)
            .keyboardType(.numberPad)
            .textContentType(.telephoneNumber)
            .focused($focusedField, equals: .phoneNumber)
            .onChange(of: phoneNumber) { _, newValue in
                phoneNumber = String(newValue.filter(\.isNumber).prefix(11))
            }
            .inputStyle(isFocused: focusedField == .phoneNumber)
            .contentShape(.rect)
            .onTapGesture { focusedField = .phoneNumber }
    }

    private var passwordField: some View {
        SecureField("비밀번호", text: $password)
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
        Button("로그인", action: submit)
            .buttonStyle(.submit)
            .disabled(!canSubmit)
    }

    private func submit() {
        focusedField = nil
    }
}

#Preview("라이트") {
    LoginView()
        .preferredColorScheme(.light)
}

#Preview("다크") {
    LoginView()
        .preferredColorScheme(.dark)
}
