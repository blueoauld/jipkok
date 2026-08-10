import Foundation

struct TokenStore: Sendable {
    
    private enum Key {
        static let accessToken = "accessToken"
        static let refreshToken = "refreshToken"
    }
    
    private let keychain: Keychain
    
    init(keychain: Keychain = Keychain()) {
        self.keychain = keychain
    }
    
    var accessToken: String? {
        keychain.string(for: Key.accessToken)
    }
    
    var refreshToken: String? {
        keychain.string(for: Key.refreshToken)
    }
    
    var hasSession: Bool {
        refreshToken != nil
    }
    
    func save(accessToken: String, refreshToken: String) throws {
        try keychain.set(accessToken, for: Key.accessToken)
        try keychain.set(refreshToken, for: Key.refreshToken)
    }
    
    func clear() throws {
        try keychain.remove(Key.accessToken)
        try keychain.remove(Key.refreshToken)
    }
}
