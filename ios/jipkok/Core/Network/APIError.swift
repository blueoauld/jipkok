import Foundation
import OpenAPIRuntime

struct APIError: Error, Equatable {

    static let unknownCode = "UNKNOWN"
    static let fallbackMessage = "요청을 처리하지 못했습니다."

    let status: Int
    let code: String
    let message: String

    var isUnauthorized: Bool {
        status == 401
    }
}

extension APIError {

    private struct Payload: Decodable {
        let code: String
        let message: String
    }

    private static let maxBodyBytes = 64 * 1024

    init(status: Int, body: HTTPBody?) async {
        guard let body,
              let data = try? await Data(collecting: body, upTo: Self.maxBodyBytes),
              let payload = try? JSONDecoder().decode(Payload.self, from: data)
        else {
            self.init(status: status, code: Self.unknownCode, message: Self.fallbackMessage)
            return
        }

        self.init(status: status, code: payload.code, message: payload.message)
    }
}
