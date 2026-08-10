import SwiftUI

private let dotSize: CGFloat = 7
private let dotSpacing: CGFloat = 6

struct MyProfileView: View {

    @State private var viewModel = MyProfileViewModel()
    @State private var photoIndex = 0
    @State private var isViewingPhotos = false

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
            .onAppear { Task { await viewModel.load() } }
    }

    @ViewBuilder
    private var content: some View {
        if let profile = viewModel.profile {
            profileContent(profile)
        } else {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private func profileContent(_ profile: MyProfile) -> some View {
        ScrollView {
            photoArea(profile)

            VStack(alignment: .leading, spacing: 12) {
                summary(profile)
                section("코멘트", body: profile.comment, placeholder: "아직 코멘트를 작성하지 않았습니다.")
                section("자기소개", body: profile.bio, placeholder: "아직 자기소개를 작성하지 않았습니다.")
            }
            .padding()
        }
        .scrollIndicators(.hidden)
    }

    @ViewBuilder
    private func photoArea(_ profile: MyProfile) -> some View {
        let urls = profile.allPhotoURLs

        if urls.isEmpty {
            Color(.secondarySystemBackground)
                .aspectRatio(1, contentMode: .fit)
                .overlay {
                    Image(systemName: "photo")
                        .font(.largeTitle)
                        .foregroundStyle(.tertiary)
                }
        } else {
            PhotoCarousel(urls: urls, currentIndex: $photoIndex) { index in
                photoIndex = index
                isViewingPhotos = true
            }
            .aspectRatio(1, contentMode: .fit)
            .overlay(alignment: .bottom) {
                pageIndicator(count: urls.count)
            }
        }
    }

    @ViewBuilder
    private func pageIndicator(count: Int) -> some View {
        if count > 1 {
            HStack(spacing: dotSpacing) {
                ForEach(0..<count, id: \.self) { index in
                    Circle()
                        .fill(.white)
                        .opacity(index == photoIndex ? 1 : 0.4)
                        .frame(width: dotSize, height: dotSize)
                }
            }
            .padding(12)
            .animation(.easeOut(duration: 0.15), value: photoIndex)
        }
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
}

#Preview {
    NavigationStack {
        MyProfileView()
    }
}
