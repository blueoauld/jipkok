import SwiftUI

private let nicknameMaxLength = 10
private let birthYearLength = 4
private let bioMaxLength = 1000
private let bioLineCount = 7

struct SetupView: View {

    private enum Field {
        case nickname
        case birthYear
        case bio
    }

    @State private var nickname = ""
    @State private var birthYear = ""
    @State private var bio = ""

    @FocusState private var focusedField: Field?

    private var canSubmit: Bool {
        !nickname.isEmpty && birthYear.count == birthYearLength
    }

    var body: some View {
        content
            .navigationTitle("프로필 설정")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden()
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
        TextField("닉네임", text: $nickname)
            .textContentType(.nickname)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .submitLabel(.next)
            .focused($focusedField, equals: .nickname)
            .onSubmit { focusedField = .birthYear }
            .onChange(of: nickname) { _, newValue in
                nickname = String(newValue.prefix(nicknameMaxLength))
            }
            .inputStyle(isFocused: focusedField == .nickname)
            .contentShape(.rect)
            .onTapGesture { focusedField = .nickname }
    }

    private var birthYearField: some View {
        TextField("출생연도", text: $birthYear)
            .keyboardType(.numberPad)
            .focused($focusedField, equals: .birthYear)
            .onChange(of: birthYear) { _, newValue in
                birthYear = String(newValue.filter(\.isNumber).prefix(birthYearLength))
            }
            .inputStyle(isFocused: focusedField == .birthYear)
            .contentShape(.rect)
            .onTapGesture { focusedField = .birthYear }
    }

    private var bioField: some View {
        VStack(alignment: .trailing, spacing: 8) {
            TextField("자기소개", text: $bio, axis: .vertical)
                .lineLimit(bioLineCount, reservesSpace: true)
                .focused($focusedField, equals: .bio)
                .onChange(of: bio) { _, newValue in
                    bio = String(newValue.prefix(bioMaxLength))
                }
                .inputStyle(isFocused: focusedField == .bio)
                .contentShape(.rect)
                .onTapGesture { focusedField = .bio }

            Text("\(String(bio.count)) / \(String(bioMaxLength))")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private var submitButton: some View {
        Button("들어가기", action: submit)
            .buttonStyle(.submit)
            .disabled(!canSubmit)
    }

    private func submit() {
        focusedField = nil
    }
}

#Preview("라이트") {
    NavigationStack {
        SetupView()
    }
    .preferredColorScheme(.light)
}

#Preview("다크") {
    NavigationStack {
        SetupView()
    }
    .preferredColorScheme(.dark)
}
