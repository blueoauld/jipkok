import SafariServices
import SwiftUI

struct WebPage: Identifiable {

    let url: URL

    var id: URL { url }
}

enum LegalPage {

    static let terms = WebPage(url: URL(string: "https://jipkok.app/terms")!)
    static let privacy = WebPage(url: URL(string: "https://jipkok.app/privacy")!)
}

struct SafariView: UIViewControllerRepresentable {

    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }

    func updateUIViewController(_ controller: SFSafariViewController, context: Context) {}
}
