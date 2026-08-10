import Observation

private let nicknameMaxLength = 10
private let birthYearLength = 4
private let bioMaxLength = 1000

@Observable
@MainActor
final class ProfileEditViewModel {

    var nickname = ""
    var birthYear = ""
    var bio = ""
    var message: String?

    private(set) var isLoading = false
    private(set) var isSubmitting = false
    private(set) var didSave = false

    private var profile: MyProfile?

    var canSubmit: Bool {
        profile != nil
            && !nickname.isEmpty
            && birthYear.count == birthYearLength
            && !isSubmitting
    }

    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }

    private let repository: MemberRepository

    init(repository: MemberRepository = MemberRepository()) {
        self.repository = repository
    }

    func sanitizeNickname() {
        nickname = String(nickname.prefix(nicknameMaxLength))
    }

    func sanitizeBirthYear() {
        birthYear = String(birthYear.filter(\.isNumber).prefix(birthYearLength))
    }

    func sanitizeBio() {
        bio = String(bio.prefix(bioMaxLength))
    }

    func loadIfNeeded() async {
        guard profile == nil, !isLoading else { return }

        isLoading = true

        defer { isLoading = false }

        do {
            let profile = try await repository.findMyProfile()
            self.profile = profile
            nickname = profile.nickname
            birthYear = String(profile.birthYear)
            bio = profile.bio ?? ""
        } catch {
            message = APIError.from(error).message
        }
    }

    func submit() async {
        guard canSubmit, let profile, let year = Int(birthYear) else { return }

        isSubmitting = true

        defer { isSubmitting = false }

        do {
            try await repository.editProfile(
                nickname: nickname,
                birthYear: year,
                bio: bio.isEmpty ? nil : bio,
                publicPhotoKeys: profile.publicPhotos.map(\.objectKey),
                secretPhotoKeys: profile.secretPhotos.map(\.objectKey)
            )

            didSave = true
            message = "프로필을 수정하셨습니다."
        } catch {
            message = APIError.from(error).message
        }
    }
}
