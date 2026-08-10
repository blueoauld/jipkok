enum BirthYear {
    
    static let length = 4
    
    static func sanitized(_ value: String) -> String {
        String(value.filter(\.isNumber).prefix(length))
    }
}
