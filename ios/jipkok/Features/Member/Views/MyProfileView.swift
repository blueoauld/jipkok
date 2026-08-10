import SwiftUI

struct MyProfileView: View {
    
    @State private var viewModel = MyProfileViewModel()
    @State private var photoIndex = 0
    @State private var isViewingPhotos = false
    
    init() {}
    
    fileprivate init(viewModel: MyProfileViewModel) {
        _viewModel = State(wrappedValue: viewModel)
    }
    
    var body: some View {
        content
            .navigationTitle("내 프로필")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink("편집", value: SettingRoute.editProfile)
                        .disabled(viewModel.profile == nil)
                }
            }
            .alert("알림", isPresented: $viewModel.isShowingMessage) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(viewModel.message ?? "")
            }
            .fullScreenCover(isPresented: $isViewingPhotos) {
                PhotoViewer(urls: viewModel.profile?.allPhotoURLs ?? [], index: $photoIndex)
            }
            .task { await viewModel.load() }
    }
    
    private var content: some View {
        ScrollView {
            switch viewModel.displayState {
            case .loading:
                ProgressView()
                    .containerRelativeFrame([.horizontal, .vertical])
            case .empty:
                ContentUnavailableView("프로필을 불러오지 못했습니다.", systemImage: "person.slash")
                    .containerRelativeFrame([.horizontal, .vertical])
            case .content:
                if let profile = viewModel.profile {
                    profileContent(profile)
                }
            }
        }
        .scrollIndicators(.hidden)
    }
    
    private func profileContent(_ profile: MyProfile) -> some View {
        VStack {
            photoArea(profile)
            
            VStack(alignment: .leading, spacing: 12) {
                summary(profile)
                ProfileSection("코멘트", body: profile.comment, placeholder: "아직 코멘트를 작성하지 않았습니다.")
                ProfileSection("자기소개", body: profile.bio, placeholder: "아직 자기소개를 작성하지 않았습니다.")
            }
            .padding()
        }
    }
    
    private func photoArea(_ profile: MyProfile) -> some View {
        ProfilePhotoArea(urls: profile.allPhotoURLs, index: $photoIndex) { index in
            photoIndex = index
            isViewingPhotos = true
        }
        .overlay(alignment: .topLeading) {
            if profile.isSecretPhoto(at: photoIndex) {
                secretBadge
            }
        }
    }
    
    private var secretBadge: some View {
        Text("비밀")
            .font(.caption.weight(.semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(.black.opacity(0.5), in: .capsule)
            .padding(12)
    }
    
    private func summary(_ profile: MyProfile) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(profile.nickname)
                .font(.title3.bold())
                .lineLimit(1)
            
            Text("\(profile.gender.label) · \(profile.age)살 · ♥ \(profile.receivedLikeCount.formatted())")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }
    
}

#Preview("프로필") {
    NavigationStack {
        MyProfileView(viewModel: .preview(profile: .preview))
    }
}

#Preview("작성 전") {
    NavigationStack {
        MyProfileView(viewModel: .preview(profile: .previewEmpty))
    }
}

#Preview("로딩 중") {
    NavigationStack {
        MyProfileView(viewModel: .preview(isLoading: true))
    }
}

#Preview("불러오기 실패") {
    NavigationStack {
        MyProfileView(viewModel: .preview())
    }
}
