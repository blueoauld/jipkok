import Foundation
import OpenAPIRuntime

struct APIDateTranscoder: DateTranscoder {

    private let fractional = Date.ISO8601FormatStyle(includingFractionalSeconds: true)
    private let plain = Date.ISO8601FormatStyle()

    func encode(_ date: Date) throws -> String {
        date.formatted(fractional)
    }

    func decode(_ string: String) throws -> Date {
        if let date = try? fractional.parse(string) {
            return date
        }

        return try plain.parse(string)
    }
}
