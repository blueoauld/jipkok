import Foundation
import HTTPTypes
import OpenAPIRuntime

struct ErrorMappingMiddleware: ClientMiddleware {

    func intercept(
        _ request: HTTPRequest,
        body: HTTPBody?,
        baseURL: URL,
        operationID: String,
        next: @concurrent @Sendable (HTTPRequest, HTTPBody?, URL) async throws -> (HTTPResponse, HTTPBody?)
    ) async throws -> (HTTPResponse, HTTPBody?) {
        let (response, responseBody) = try await next(request, body, baseURL)

        guard response.status.code >= 400 else {
            return (response, responseBody)
        }

        let error = await APIError(status: response.status.code, body: responseBody)

        throw error
    }
}
