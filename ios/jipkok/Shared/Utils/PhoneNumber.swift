enum PhoneNumber {

    static let length = 11

    static func sanitized(_ value: String) -> String {
        String(value.filter(\.isNumber).prefix(length))
    }
}
