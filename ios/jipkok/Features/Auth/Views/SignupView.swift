import SwiftUI

struct SignupView: View {
    
    private enum Field {
        case phoneNumber
        case verificationCode
        case password
        case passwordConfirm
    }
    
    private enum Gender: CaseIterable {
        case male
        case female
        
        var label: String {
            switch self {
            case .male: "남자"
            case .female: "여자"
            }
        }
    }
    
    @State private var phoneNumber = ""
    @State private var verificationCode = ""
    @State private var password = ""
    @State private var passwordConfirm = ""
    @State private var gender: Gender?
    
    @FocusState private var focusedField: Field?
    
    private var canSendCode: Bool {
        phoneNumber.count == 11
    }
    
    private var canSubmit: Bool {
        !phoneNumber.isEmpty
        && !verificationCode.isEmpty
        && !password.isEmpty
        && !passwordConfirm.isEmpty
        && gender != nil
    }
    
    var body: some View {
        content
            .navigationTitle("회원가입")
            .navigationBarTitleDisplayMode(.inline)
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
        .safeAreaInset(edge: .bottom) {
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
    
    private var sendCodeButton: some View {
        Button("전송", action: sendCode)
            .buttonStyle(.action)
            .disabled(!canSendCode)
    }
    
    private var verificationCodeField: some View {
        TextField("인증번호", text: $verificationCode)
            .keyboardType(.numberPad)
            .textContentType(.oneTimeCode)
            .focused($focusedField, equals: .verificationCode)
            .onChange(of: verificationCode) { _, newValue in
                verificationCode = String(newValue.filter(\.isNumber).prefix(6))
            }
            .inputStyle(isFocused: focusedField == .verificationCode)
            .contentShape(.rect)
            .onTapGesture { focusedField = .verificationCode }
    }
    
    private var passwordField: some View {
        SecureField("비밀번호", text: $password)
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
        SecureField("비밀번호 확인", text: $passwordConfirm)
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
            ForEach(Gender.allCases, id: \.self) { item in
                Button {
                    gender = item
                } label: {
                    Text(item.label)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.action(isSelected: gender == item))
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
        Button("회원가입", action: submit)
            .buttonStyle(.submit)
            .disabled(!canSubmit)
    }
    
    private var legalLinks: some View {
        HStack(alignment: .center) {
            Button("개인정보 처리방침") {}
            Text("|")
            Button("서비스 이용약관") {}
        }
        .font(.footnote)
        .buttonStyle(.plain)
        .foregroundStyle(.secondary)
    }
    
    private func sendCode() {
        focusedField = nil
    }
    
    private func submit() {
        focusedField = nil
    }
}

#Preview("라이트") {
    NavigationStack {
        SignupView()
    }
    .preferredColorScheme(.light)
}

#Preview("다크") {
    NavigationStack {
        SignupView()
    }
    .preferredColorScheme(.dark)
}
