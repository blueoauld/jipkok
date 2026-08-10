import Observation

@Observable
@MainActor
final class AuthSession {
    
    enum Status {
        case unknown
        case authenticated
        case unauthenticated
    }
    
    private(set) var status: Status = .unknown
    
    private let tokenStore: TokenStore
    
    init(tokenStore: TokenStore = TokenStore()) {
        self.tokenStore = tokenStore
    }
    
    func restore() {
        status = tokenStore.hasSession ? .authenticated : .unauthenticated
    }
    
    func signin(accessToken: String, refreshToken: String) throws {
        try tokenStore.save(accessToken: accessToken, refreshToken: refreshToken)
        status = .authenticated
    }
    
    func signout() {
        try? tokenStore.clear()
        status = .unauthenticated
    }
}
