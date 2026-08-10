import SwiftUI

private let actionBarHeight: CGFloat = 64
private let actionIconSize: CGFloat = 26
private let badgeSize: CGFloat = 18

struct MemberDetailView: View {
    
    private enum Action: CaseIterable {
        case like
        case favorite
        case note
        case secretPhoto
        case block
        
        var systemImage: String {
            switch self {
            case .like: "heart.fill"
            case .favorite: "star.fill"
            case .note: "bubble.left.fill"
            case .secretPhoto: "photo.fill"
            case .block: "nosign"
            }
        }
        
        var label: String {
            switch self {
            case .like: "좋아요"
            case .favorite: "즐겨찾기"
            case .note: "쪽지"
            case .secretPhoto: "비밀 사진"
            case .block: "차단"
            }
        }
        
        var filledColor: Color {
            switch self {
            case .like: .red
            case .favorite: .yellow
            case .note: .accentColor
            case .secretPhoto: .green
            case .block: .red
            }
        }
    }
    
    @State private var viewModel: MemberDetailViewModel
    
    init(id: Int) {
        _viewModel = State(wrappedValue: MemberDetailViewModel(id: id))
    }
    
    var body: some View {
        content
            .navigationTitle("프로필")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    moreMenu
                }
            }
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(viewModel.message ?? "")
            }
            .task { await viewModel.loadIfNeeded() }
    }
    
    @ViewBuilder
    private var content: some View {
        if let member = viewModel.member {
            profile(member)
        } else {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
    
    private func profile(_ member: MemberDetail) -> some View {
        ScrollView {
            photoArea
            
            VStack(alignment: .leading, spacing: 12) {
                summary(member)
                section("코멘트", body: member.comment, placeholder: "코멘트가 없습니다.")
                section("자기소개", body: member.bio, placeholder: "자기소개가 없습니다.")
            }
            .padding()
        }
        .scrollIndicators(.hidden)
        .safeAreaBar(edge: .bottom) {
            actionBar(member)
        }
    }
    
    private var photoArea: some View {
        Color(.secondarySystemBackground)
            .aspectRatio(1, contentMode: .fit)
    }
    
    private func summary(_ member: MemberDetail) -> some View {
        VStack {
            HStack {
                Text(member.nickname)
                    .font(.title3.bold())
                    .lineLimit(1)
                
                Spacer()
                
                if let locatedAt = member.locatedAt {
                    Text(relativeTime(from: locatedAt))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .layoutPriority(1)
                }
            }
            
            HStack {
                Text("\(member.gender.label) · \(member.age)살 · ♥ \(member.receivedLikeCount.formatted())")
                    .font(.subheadline)
                
                Spacer()
                
                if let distance = member.distanceInMeters {
                    Text(formatDistance(distance))
                        .font(.caption)
                        .layoutPriority(1)
                }
            }
            .foregroundStyle(.secondary)
        }
    }
    
    private func section(_ title: String, body: String?, placeholder: String) -> some View {
        VStack(alignment: .leading) {
            Text(title)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
            
            Text(body ?? placeholder)
                .font(.body)
                .foregroundStyle(body == nil ? .secondary : .primary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color(.secondarySystemBackground), in: .rect(cornerRadius: fieldCornerRadius))
        }
    }
    
    private func actionBar(_ member: MemberDetail) -> some View {
        HStack {
            ForEach(Action.allCases, id: \.self) { action in
                actionButton(action, member: member)
            }
        }
        .frame(height: actionBarHeight)
        .glassEffect(.clear, in: .capsule)
        .padding()
    }
    
    private func actionButton(_ action: Action, member: MemberDetail) -> some View {
        Button {
            perform(action)
        } label: {
            Image(systemName: action.systemImage)
                .font(.system(size: actionIconSize))
                .foregroundStyle(foreground(action, member: member))
                .overlay(alignment: .topTrailing) {
                    if action == .secretPhoto {
                        countBadge(member)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .buttonStyle(.plain)
        .disabled(isDisabled(action, member: member))
        .accessibilityLabel(action.label)
    }
    
    private func countBadge(_ member: MemberDetail) -> some View {
        Text(member.secretPhotoCount.formatted())
            .font(.caption2.weight(.bold))
            .foregroundStyle(.white)
            .frame(width: badgeSize, height: badgeSize)
            .background(member.secretPhotoCount > 0 ? .red : .gray, in: .circle)
            .offset(x: badgeSize / 4, y: -badgeSize / 3)
    }
    
    private var moreMenu: some View {
        Menu {
            Button("비밀 사진 공개") {}
            
            Button("신고", role: .destructive) {}
        } label: {
            Image(systemName: "ellipsis")
        }
        .accessibilityLabel("더 보기")
    }
    
    private func perform(_ action: Action) {
        switch action {
        case .like: Task { await viewModel.toggleLike() }
        case .favorite: Task { await viewModel.toggleFavorite() }
        case .note, .secretPhoto, .block: break
        }
    }
    
    private func isFilled(_ action: Action, member: MemberDetail) -> Bool {
        switch action {
        case .like: member.isLiked
        case .favorite: member.isFavorited
        case .note: member.isNoteReceiveEnabled
        case .secretPhoto: member.isSecretPhotoGrantedToMe
        case .block: member.isBlocked
        }
    }
    
    private func isDisabled(_ action: Action, member: MemberDetail) -> Bool {
        action == .note && !member.isNoteReceiveEnabled
    }
    
    private func foreground(_ action: Action, member: MemberDetail) -> Color {
        if isDisabled(action, member: member) {
            return Color(.tertiaryLabel)
        }
        
        return isFilled(action, member: member) ? action.filledColor : Color(.secondaryLabel)
    }
}

private func relativeTime(from date: Date, now: Date = Date()) -> String {
    now.timeIntervalSince(date) < 60
    ? "방금 전"
    : date.formatted(.relative(presentation: .numeric))
}

private func formatDistance(_ meters: Double) -> String {
    (meters / 1_000).formatted(.number.precision(.fractionLength(1))) + "km"
}

#Preview {
    NavigationStack {
        MemberDetailView(id: 1)
    }
}
