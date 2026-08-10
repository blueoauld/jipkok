import Foundation
import OpenAPIRuntime
import OpenAPIURLSession

enum APIClient {
    
    static func make(middlewares: [any ClientMiddleware] = []) -> Client {
        Client(
            serverURL: APIConfiguration.baseURL,
            configuration: Configuration(dateTranscoder: APIDateTranscoder()),
            transport: URLSessionTransport(),
            middlewares: [ErrorMappingMiddleware(), AppHeadersMiddleware()] + middlewares
        )
    }
    
    static func authenticated(tokenStore: TokenStore = TokenStore()) -> Client {
        make(middlewares: [
            AuthenticationMiddleware(
                tokenStore: tokenStore,
                refresher: TokenRefresher(tokenStore: tokenStore)
            )
        ])
    }
}
