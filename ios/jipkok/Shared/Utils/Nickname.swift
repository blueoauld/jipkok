import Foundation

enum Nickname {
    
    static let minLength = 2
    static let maxLength = 10
    
    static func sanitized(_ value: String) -> String {
        String(value.prefix(maxLength))
    }
    
    static func trimmed(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
