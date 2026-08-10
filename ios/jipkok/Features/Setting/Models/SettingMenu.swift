import SwiftUI

struct SettingMenuItem: Identifiable {
    
    enum Kind {
        case link
        case external
        case action
    }
    
    enum Action {
        case attendanceReward
        case adReward
        case contact
        case suggest
    }
    
    let label: String
    let systemImage: String
    let color: Color
    let kind: Kind
    var destination: SettingRoute?
    var action: Action?
    
    var id: String { label }
}

struct SettingMenuSection: Identifiable {
    let id: String
    let items: [SettingMenuItem]
}

enum SettingMenu {
    
    static let sections: [SettingMenuSection] = [
        SettingMenuSection(id: "profile", items: [
            SettingMenuItem(label: "내 프로필", systemImage: "person.fill", color: .blue, kind: .link, destination: .myProfile)
        ]),
        SettingMenuSection(id: "activity", items: [
            SettingMenuItem(label: "좋아요 목록", systemImage: "heart.fill", color: .pink, kind: .link, destination: .activity(.like)),
            SettingMenuItem(label: "즐겨찾기 목록", systemImage: "star.fill", color: .yellow, kind: .link, destination: .activity(.favorite)),
            SettingMenuItem(label: "비밀 사진 목록", systemImage: "photo.fill", color: .green, kind: .link, destination: .activity(.secretPhoto)),
            SettingMenuItem(label: "차단 목록", systemImage: "nosign", color: .red, kind: .link, destination: .activity(.block))
        ]),
        SettingMenuSection(id: "received", items: [
            SettingMenuItem(label: "받은 좋아요 목록", systemImage: "arrow.down.heart.fill", color: .pink, kind: .link, destination: .activity(.receivedLike)),
            SettingMenuItem(label: "받은 즐겨찾기 목록", systemImage: "tray.and.arrow.down.fill", color: .yellow, kind: .link, destination: .activity(.receivedFavorite)),
            SettingMenuItem(label: "공개된 비밀 사진 목록", systemImage: "lock.open.fill", color: .green, kind: .link, destination: .activity(.openedSecretPhoto)),
            SettingMenuItem(label: "내 프로필 조회 목록", systemImage: "shoeprints.fill", color: .teal, kind: .link, destination: .activity(.profileView))
        ]),
        SettingMenuSection(id: "point", items: [
            SettingMenuItem(label: "포인트 내역", systemImage: "wonsign.circle.fill", color: .purple, kind: .link, destination: .pointHistory),
            SettingMenuItem(label: "출석 보상", systemImage: "calendar.circle.fill", color: .mint, kind: .action, action: .attendanceReward),
            SettingMenuItem(label: "광고 보상", systemImage: "play.rectangle.fill", color: .indigo, kind: .action, action: .adReward)
        ]),
        SettingMenuSection(id: "support", items: [
            SettingMenuItem(label: "문의하기", systemImage: "questionmark.circle.fill", color: .blue, kind: .action),
            SettingMenuItem(label: "건의하기", systemImage: "lightbulb.fill", color: .orange, kind: .action),
            SettingMenuItem(label: "서비스 이용약관", systemImage: "doc.text.fill", color: .gray, kind: .external),
            SettingMenuItem(label: "개인정보 처리방침", systemImage: "checkmark.shield.fill", color: .green, kind: .external)
        ])
    ]
}
