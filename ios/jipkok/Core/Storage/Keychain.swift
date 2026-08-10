import Foundation

enum KeychainError: Error {
    case unexpectedStatus(OSStatus)
}

struct Keychain: Sendable {
    
    private let service: String
    
    init(service: String = Bundle.main.bundleIdentifier ?? "jipkok") {
        self.service = service
    }
    
    func string(for key: String) -> String? {
        var query = baseQuery(for: key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess, let data = item as? Data else { return nil }
        
        return String(data: data, encoding: .utf8)
    }
    
    func set(_ value: String, for key: String) throws {
        try remove(key)
        
        var query = baseQuery(for: key)
        query[kSecValueData as String] = Data(value.utf8)
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw KeychainError.unexpectedStatus(status)
        }
    }
    
    func remove(_ key: String) throws {
        let status = SecItemDelete(baseQuery(for: key) as CFDictionary)
        
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unexpectedStatus(status)
        }
    }
    
    private func baseQuery(for key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
    }
}
