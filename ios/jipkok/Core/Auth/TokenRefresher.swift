import Foundation

enum TokenRefreshError: Error {
    case noRefreshToken
}

actor TokenRefresher {
    
    private let tokenStore: TokenStore
    private let client: Client
    private var ongoing: Task<String, Error>?
    
    init(tokenStore: TokenStore) {
        self.tokenStore = tokenStore
        self.client = APIClient.make()
    }
    
    func refresh() async throws -> String {
        if let ongoing {
            return try await ongoing.value
        }
        
        let task = Task { try await reissue() }
        ongoing = task
        
        defer { ongoing = nil }
        
        return try await task.value
    }
    
    private func reissue() async throws -> String {
        guard let refreshToken = tokenStore.refreshToken else {
            throw TokenRefreshError.noRefreshToken
        }
        
        do {
            let output = try await client.reissue(.init(body: .json(.init(refreshToken: refreshToken))))
            let tokens = try output.ok.body.json
            try tokenStore.save(accessToken: tokens.accessToken, refreshToken: tokens.refreshToken)
            
            return tokens.accessToken
        } catch {
            try? tokenStore.clear()
            
            throw error
        }
    }
}
