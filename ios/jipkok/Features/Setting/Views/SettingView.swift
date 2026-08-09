import SwiftUI

private let iconBoxSize: CGFloat = 29
private let iconGlyphSize: CGFloat = 12
private let iconCornerRadius: CGFloat = 8

struct SettingView: View {
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(SettingMenu.sections) { section in
                    Section {
                        ForEach(section.items) { item in
                            row(item)
                        }
                    }
                }
            }
            .navigationTitle("설정")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    accountMenu
                }
            }
        }
    }
    
    private func row(_ item: SettingMenuItem) -> some View {
        Button {
        } label: {
            HStack {
                Label {
                    Text(item.label)
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                } icon: {
                    icon(item)
                }
                
                Spacer()
                
                accessory(for: item.kind)
            }
        }
        .buttonStyle(.plain)
    }
    
    private func icon(_ item: SettingMenuItem) -> some View {
        Image(systemName: item.systemImage)
            .font(.system(size: iconGlyphSize, weight: .semibold))
            .foregroundStyle(.white)
            .frame(width: iconBoxSize, height: iconBoxSize)
            .background(item.color, in: .rect(cornerRadius: iconCornerRadius))
    }

    @ViewBuilder
    private func accessory(for kind: SettingMenuItem.Kind) -> some View {
        switch kind {
        case .link:
            Image(systemName: "chevron.right")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.tertiary)
        case .external:
            Image(systemName: "arrow.up.right")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.tertiary)
        case .action:
            EmptyView()
        }
    }
    
    private var accountMenu: some View {
        Menu {
            Button("로그아웃") {}
            
            Button("회원탈퇴", role: .destructive) {}
        } label: {
            Image(systemName: "ellipsis")
        }
        .accessibilityLabel("계정")
    }
}

#Preview {
    SettingView()
}
