import Observation
import UIKit

let profilePhotoMaxCount = 6

struct EditablePhoto: Identifiable {
    
    enum Source {
        case remote(URL)
        case local(UIImage)
    }
    
    let objectKey: String
    let source: Source
    
    var id: String { objectKey }
}

@Observable
@MainActor
final class ProfileEditViewModel {
    
    var nickname = ""
    var birthYear = ""
    var bio = ""
    var message: String?
    
    private(set) var publicPhotos: [EditablePhoto] = []
    private(set) var secretPhotos: [EditablePhoto] = []
    private(set) var isProcessing = false
    
    private(set) var isLoading = false
    private(set) var isSubmitting = false
    private(set) var didSave = false
    
    private var profile: MyProfile?
    
    var canSubmit: Bool {
        profile != nil
        && (Nickname.minLength...Nickname.maxLength).contains(trimmedNickname.count)
        && birthYear.count == BirthYear.length
        && !isSubmitting
    }
    
    private var trimmedNickname: String {
        Nickname.trimmed(nickname)
    }
    
    var displayState: DisplayState {
        if profile == nil {
            return isLoading ? .loading : .empty
        }
        
        return .content
    }
    
    var isShowingMessage: Bool {
        get { message != nil }
        set { if !newValue { message = nil } }
    }
    
    private let repository: MemberRepository
    private let uploader: ProfilePhotoUploader
    
    init(
        repository: MemberRepository = MemberRepository(),
        uploader: ProfilePhotoUploader = ProfilePhotoUploader()
    ) {
        self.repository = repository
        self.uploader = uploader
    }
    
    func photos(for visibility: PhotoVisibility) -> [EditablePhoto] {
        switch visibility {
        case .public: publicPhotos
        case .secret: secretPhotos
        }
    }
    
    func canAddPhoto(for visibility: PhotoVisibility) -> Bool {
        photos(for: visibility).count < profilePhotoMaxCount
    }
    
    func addPhotos(_ images: [UIImage], visibility: PhotoVisibility) async {
        guard !isProcessing, !images.isEmpty else { return }
        
        isProcessing = true
        
        defer { isProcessing = false }
        
        for image in images {
            guard canAddPhoto(for: visibility) else { break }
            
            do {
                let objectKey = try await uploader.upload(image, visibility: visibility)
                let photo = EditablePhoto(objectKey: objectKey, source: .local(image))
                
                switch visibility {
                case .public: publicPhotos.append(photo)
                case .secret: secretPhotos.append(photo)
                }
            } catch {
                guard !error.isCancellation else { break }
                
                message = APIError.from(error).message
                
                break
            }
        }
    }
    
    func movePhoto(_ photo: EditablePhoto, by offset: Int, visibility: PhotoVisibility) {
        switch visibility {
        case .public: move(&publicPhotos, photo: photo, by: offset)
        case .secret: move(&secretPhotos, photo: photo, by: offset)
        }
    }
    
    private func move(_ photos: inout [EditablePhoto], photo: EditablePhoto, by offset: Int) {
        guard let index = photos.firstIndex(where: { $0.id == photo.id }) else { return }
        
        let target = index + offset
        
        guard photos.indices.contains(target) else { return }
        
        photos.swapAt(index, target)
    }
    
    func removePhoto(_ photo: EditablePhoto, visibility: PhotoVisibility) {
        switch visibility {
        case .public: publicPhotos.removeAll { $0.id == photo.id }
        case .secret: secretPhotos.removeAll { $0.id == photo.id }
        }
    }
    
    func sanitizeNickname() {
        nickname = Nickname.sanitized(nickname)
    }
    
    func sanitizeBirthYear() {
        birthYear = BirthYear.sanitized(birthYear)
    }
    
    func sanitizeBio() {
        bio = Bio.sanitized(bio)
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
            publicPhotos = profile.publicPhotos.map { EditablePhoto(objectKey: $0.objectKey, source: .remote($0.url)) }
            secretPhotos = profile.secretPhotos.map { EditablePhoto(objectKey: $0.objectKey, source: .remote($0.url)) }
        } catch {
            guard !error.isCancellation else { return }
            
            message = APIError.from(error).message
        }
    }
    
    func submit() async {
        guard canSubmit, profile != nil, let year = Int(birthYear) else { return }
        
        isSubmitting = true
        
        defer { isSubmitting = false }
        
        do {
            try await repository.editProfile(
                nickname: trimmedNickname,
                birthYear: year,
                bio: bio.isEmpty ? nil : bio,
                publicPhotoKeys: publicPhotos.map(\.objectKey),
                secretPhotoKeys: secretPhotos.map(\.objectKey)
            )
            
            didSave = true
            message = "프로필을 수정하셨습니다."
        } catch {
            guard !error.isCancellation else { return }

            message = APIError.from(error).message
        }
    }
}

extension ProfileEditViewModel {

    static func preview(
        profile: MyProfile? = nil,
        isLoading: Bool = false,
        isProcessing: Bool = false
    ) -> ProfileEditViewModel {
        let viewModel = ProfileEditViewModel()
        viewModel.isLoading = isLoading
        viewModel.isProcessing = isProcessing

        guard let profile else { return viewModel }

        viewModel.profile = profile
        viewModel.nickname = profile.nickname
        viewModel.birthYear = String(profile.birthYear)
        viewModel.bio = profile.bio ?? ""
        viewModel.publicPhotos = profile.publicPhotos.map { EditablePhoto(objectKey: $0.objectKey, source: .remote($0.url)) }
        viewModel.secretPhotos = profile.secretPhotos.map { EditablePhoto(objectKey: $0.objectKey, source: .remote($0.url)) }
        return viewModel
    }
}
