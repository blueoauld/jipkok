enum Bio {
    
    static let maxLength = 1000
    
    static func sanitized(_ value: String) -> String {
        String(value.prefix(maxLength))
    }
}
