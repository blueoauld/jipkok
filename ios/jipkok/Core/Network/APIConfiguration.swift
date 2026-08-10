import Foundation

enum APIConfiguration {

    static let baseURL: URL = {
        #if DEBUG
        URL(string: "http://192.168.0.15:8080")!
        #else
        URL(string: "https://api.jipkok.app")!
        #endif
    }()

    static let platform = "IOS"

    static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
}
