import SwiftUI

private let iconBoxSize: CGFloat = 29
private let iconGlyphSize: CGFloat = 12
private let iconCornerRadius: CGFloat = 8

struct SettingView: View {

    @State private var router = SettingRouter()
    @State private var webPage: WebPage?
    @State private var viewModel: SettingViewModel

    init(session: AuthSession) {
        _viewModel = State(wrappedValue: SettingViewModel(session: session))
    }

    var body: some View {
        NavigationStack(path: $router.path) {
            List {
                ForEach(SettingMenu.sections) { section in
                    Section {
                        ForEach(section.items) { item in
                            row(item)
                        }
                    }
                }
            }
            .navigationDestination(for: SettingRoute.self) { route in
                switch route {
                case .activity(let kind): ActivityListView(kind: kind)
                case .memberDetail(let id): MemberDetailView(id: id)
                case .pointHistory: PointHistoryView()
                case .myProfile: MyProfileView()
                case .editProfile: ProfileEditView()
                }
            }
            .navigationTitle("설정")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    accountMenu
                }
            }
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(viewModel.message ?? "")
            }
            .alert("알림", isPresented: $viewModel.isConfirmingSignout) {
                Button("로그아웃", role: .destructive) {
                    Task { await viewModel.signout() }
                }

                Button("취소", role: .cancel) {}
            } message: {
                Text("로그아웃하면 다시 로그인해야 이용할 수 있습니다.")
            }
        }
        .toolbar(router.path.isEmpty ? .visible : .hidden, for: .tabBar)
        .sheet(item: $webPage) { page in
            SafariView(url: page.url)
                .ignoresSafeArea()
        }
        .loadingOverlay(viewModel.isProcessing)
        .task { await viewModel.prepareAds() }
    }

    @ViewBuilder
    private func row(_ item: SettingMenuItem) -> some View {
        if let destination = item.destination {
            NavigationLink(value: destination) {
                rowLabel(item)
            }
        } else {
            Button {
                perform(item)
            } label: {
                HStack {
                    rowLabel(item)

                    Spacer()

                    accessory(for: item.kind)
                }
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
        }
    }

    private func perform(_ item: SettingMenuItem) {
        if let webPage = item.webPage {
            self.webPage = webPage

            return
        }

        guard let action = item.action else { return }

        Task { await viewModel.perform(action) }
    }

    private func rowLabel(_ item: SettingMenuItem) -> some View {
        Label {
            Text(item.label)
                .foregroundStyle(.primary)
                .lineLimit(1)
        } icon: {
            icon(item)
        }
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
            Button("로그아웃") { viewModel.isConfirmingSignout = true }

            Button("회원탈퇴", role: .destructive) {}
        } label: {
            Image(systemName: "ellipsis")
        }
        .accessibilityLabel("계정")
    }
}

#Preview {
    SettingView(session: AuthSession())
}
