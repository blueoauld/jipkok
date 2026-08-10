import Foundation
import OpenAPIRuntime
import OpenAPIURLSession

enum APIClient {
    
    static func make(middlewares: [any ClientMiddleware] = []) -> Client {
        Client(
            serverURL: APIConfiguration.baseURL,
            transport: URLSessionTransport(),
            middlewares: [AppHeadersMiddleware()] + middlewares + [ErrorMappingMiddleware()]
        )
    }
}
