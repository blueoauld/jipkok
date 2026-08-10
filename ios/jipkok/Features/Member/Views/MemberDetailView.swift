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
    @State private var photoIndex = 0
    @State private var isViewingPhotos = false
    @State private var secretPhotoIndex = 0
    @State private var isReporting = false
    
    init(id: Int) {
        _viewModel = State(wrappedValue: MemberDetailViewModel(id: id))
    }
    
    fileprivate init(viewModel: MemberDetailViewModel) {
        _viewModel = State(wrappedValue: viewModel)
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
            .alert("알림", isPresented: $viewModel.isConfirmingSecretPhoto) {
                Button(isSecretPhotoGranted ? "비공개" : "공개") {
                    Task { await viewModel.toggleSecretPhoto() }
                }
                
                Button("닫기", role: .cancel) {}
            } message: {
                Text(isSecretPhotoGranted ? "비밀 사진을 비공개하시겠습니까?" : "비밀 사진을 공개하시겠습니까?")
            }
            .alert("알림", isPresented: $viewModel.isConfirmingBlock) {
                Button(isBlocked ? "차단 해제" : "차단", role: isBlocked ? nil : .destructive) {
                    Task { await viewModel.toggleBlock() }
                }
                
                Button("닫기", role: .cancel) {}
            } message: {
                Text(
                    isBlocked
                    ? "차단을 해제하면 서로의 목록에 다시 표시됩니다."
                    : "차단하면 서로의 목록에 표시되지 않고, 주고받은 대화 내역도 모두 사라집니다."
                )
            }
            .fullScreenCover(isPresented: $viewModel.isViewingSecretPhotos) {
                PhotoViewer(urls: viewModel.secretPhotoURLs, index: $secretPhotoIndex, isProtected: true)
            }
            .fullScreenCover(isPresented: $isViewingPhotos) {
                PhotoViewer(urls: viewModel.member?.publicPhotoURLs ?? [], index: $photoIndex)
            }
            .sheet(isPresented: $isReporting) {
                if let member = viewModel.member {
                    NavigationStack {
                        ReportView(memberId: member.id, nickname: member.nickname)
                    }
                }
            }
            .loadingOverlay(viewModel.isProcessing)
            .task { await viewModel.loadIfNeeded() }
    }
    
    @ViewBuilder
    private var content: some View {
        switch viewModel.displayState {
        case .loading:
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        case .empty:
            ContentUnavailableView("프로필을 불러오지 못했습니다.", systemImage: "person.slash")
        case .content:
            if let member = viewModel.member {
                profile(member)
            }
        }
    }
    
    private func profile(_ member: MemberDetail) -> some View {
        ScrollView {
            photoArea(member)
            
            VStack(alignment: .leading, spacing: 12) {
                summary(member)
                ProfileSection("코멘트", body: member.comment, placeholder: "코멘트가 없습니다.")
                ProfileSection("자기소개", body: member.bio, placeholder: "자기소개가 없습니다.")
            }
            .padding()
        }
        .scrollIndicators(.hidden)
        .safeAreaBar(edge: .bottom) {
            actionBar(member)
        }
    }
    
    private func photoArea(_ member: MemberDetail) -> some View {
        ProfilePhotoArea(urls: member.publicPhotoURLs, index: $photoIndex) { index in
            photoIndex = index
            isViewingPhotos = true
        }
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
            Button(secretPhotoLabel) { viewModel.isConfirmingSecretPhoto = true }
            
            Button("신고", role: .destructive) { isReporting = true }
        } label: {
            Image(systemName: "ellipsis")
        }
        .accessibilityLabel("더 보기")
    }
    
    private var isSecretPhotoGranted: Bool {
        viewModel.member?.isSecretPhotoGrantedByMe ?? false
    }
    
    private var secretPhotoLabel: String {
        isSecretPhotoGranted ? "비밀 사진 비공개" : "비밀 사진 공개"
    }
    
    private func perform(_ action: Action) {
        switch action {
        case .like: Task { await viewModel.toggleLike() }
        case .favorite: Task { await viewModel.toggleFavorite() }
        case .secretPhoto:
            secretPhotoIndex = 0
            
            Task { await viewModel.openSecretPhotos() }
        case .block: viewModel.isConfirmingBlock = true
        case .note: break
        }
    }
    
    private var isBlocked: Bool {
        viewModel.member?.isBlocked ?? false
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



#Preview("프로필") {
    NavigationStack {
        MemberDetailView(viewModel: .preview(member: .preview))
    }
}

#Preview("처리 중") {
    NavigationStack {
        MemberDetailView(viewModel: .preview(member: .preview, isProcessing: true))
    }
}

#Preview("로딩 중") {
    NavigationStack {
        MemberDetailView(viewModel: .preview(isLoading: true))
    }
}

#Preview("불러오기 실패") {
    NavigationStack {
        MemberDetailView(viewModel: .preview())
    }
}
