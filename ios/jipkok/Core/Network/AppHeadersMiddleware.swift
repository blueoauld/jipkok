import Foundation
import HTTPTypes
import OpenAPIRuntime

struct AppHeadersMiddleware: ClientMiddleware {
    
    func intercept(
        _ request: HTTPRequest,
        body: HTTPBody?,
        baseURL: URL,
        operationID: String,
        next: @concurrent @Sendable (HTTPRequest, HTTPBody?, URL) async throws -> (HTTPResponse, HTTPBody?)
    ) async throws -> (HTTPResponse, HTTPBody?) {
        var request = request
        request.headerFields[.appVersion] = APIConfiguration.appVersion
        request.headerFields[.platform] = APIConfiguration.platform
        
        return try await next(request, body, baseURL)
    }
}

extension HTTPField.Name {
    
    static let appVersion = Self("X-App-Version")!
    static let platform = Self("X-Platform")!
}
