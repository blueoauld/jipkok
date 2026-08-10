import Foundation
import HTTPTypes
import OpenAPIRuntime

struct AuthenticationMiddleware: ClientMiddleware {

    private static let maxBodyBytes = 1024 * 1024

    let tokenStore: TokenStore
    let refresher: TokenRefresher

    func intercept(
        _ request: HTTPRequest,
        body: HTTPBody?,
        baseURL: URL,
        operationID: String,
        next: @concurrent @Sendable (HTTPRequest, HTTPBody?, URL) async throws -> (HTTPResponse, HTTPBody?)
    ) async throws -> (HTTPResponse, HTTPBody?) {
        let requestData: Data? = if let body {
            try await Data(collecting: body, upTo: Self.maxBodyBytes)
        } else {
            nil
        }
        
        let (response, responseBody) = try await next(
            authorized(request, with: tokenStore.accessToken),
            requestData.map { HTTPBody($0) },
            baseURL
        )

        guard response.status.code == 401, tokenStore.refreshToken != nil else {
            return (response, responseBody)
        }

        guard let accessToken = try? await refresher.refresh() else {
            return (response, responseBody)
        }

        return try await next(
            authorized(request, with: accessToken),
            requestData.map { HTTPBody($0) },
            baseURL
        )
    }

    private func authorized(_ request: HTTPRequest, with accessToken: String?) -> HTTPRequest {
        guard let accessToken else { return request }

        var request = request
        request.headerFields[.authorization] = "Bearer \(accessToken)"

        return request
    }
}
