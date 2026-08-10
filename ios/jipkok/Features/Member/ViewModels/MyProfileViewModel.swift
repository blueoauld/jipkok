import Observation

@Observable
@MainActor
final class MyProfileViewModel {
    
    var message: String?
    
    private(set) var profile: MyProfile?
    private(set) var isLoading = false
    
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
    
    init(repository: MemberRepository = MemberRepository()) {
        self.repository = repository
    }
    
    func load() async {
        guard !isLoading else { return }
        
        isLoading = true
        
        defer { isLoading = false }
        
        do {
            profile = try await repository.findMyProfile()
        } catch {
            guard !error.isCancellation else { return }
            
            message = APIError.from(error).message
        }
    }
}

extension MyProfileViewModel {
    
    static func preview(
        profile: MyProfile? = nil,
        isLoading: Bool = false
    ) -> MyProfileViewModel {
        let viewModel = MyProfileViewModel()
        viewModel.profile = profile
        viewModel.isLoading = isLoading
        return viewModel
    }
}
