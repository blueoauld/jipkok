import SwiftUI

private let detailMaxLength = 1000
private let detailLineCount = 7
private let photoColumnCount = 3

struct ReportView: View {

    let nickname: String
    var isChatReport = false

    @State private var reason: ReportReason?
    @State private var detail = ""

    @FocusState private var isDetailFocused: Bool

    private var title: String {
        (isChatReport ? "채팅 신고" : "신고") + " (\(nickname))"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading) {
                photoSection
                reasonList
                detailSection
            }
            .padding()
        }
        .scrollDismissesKeyboard(.interactively)
        .scrollIndicators(.hidden)
        .safeAreaBar(edge: .bottom) {
            submitButton
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var photoSection: some View {
        VStack(alignment: .leading) {
            sectionTitle("증거 사진")

            LazyVGrid(columns: Array(repeating: GridItem(spacing: 8), count: photoColumnCount), spacing: 8) {
                addPhotoButton
            }
        }
    }

    private var addPhotoButton: some View {
        Button {
        } label: {
            RoundedRectangle(cornerRadius: fieldCornerRadius)
                .fill(Color(.secondarySystemBackground))
                .aspectRatio(1, contentMode: .fit)
                .overlay {
                    Image(systemName: "plus")
                        .font(.title2)
                        .foregroundStyle(.secondary)
                }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("사진 추가")
    }

    private var reasonList: some View {
        VStack {
            ForEach(ReportReason.allCases, id: \.self) { item in
                reasonRow(item)
            }
        }
        .background(Color(.secondarySystemBackground), in: .rect(cornerRadius: fieldCornerRadius))
    }

    private func reasonRow(_ item: ReportReason) -> some View {
        Button {
            reason = item
        } label: {
            HStack {
                Text(item.label)
                    .lineLimit(1)

                Spacer()

                Image(systemName: "checkmark")
                    .font(.subheadline.weight(.bold))
                    .opacity(reason == item ? 1 : 0)
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
    }

    private var detailSection: some View {
        VStack(alignment: .trailing, spacing: 8) {
            TextField("상세 내용", text: $detail, axis: .vertical)
                .lineLimit(detailLineCount, reservesSpace: true)
                .focused($isDetailFocused)
                .onChange(of: detail) { _, newValue in
                    detail = String(newValue.prefix(detailMaxLength))
                }
                .inputStyle(isFocused: isDetailFocused)
                .contentShape(.rect)
                .onTapGesture { isDetailFocused = true }

            Text("\(String(detail.count)) / \(String(detailMaxLength))")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.secondary)
    }

    private var submitButton: some View {
        Button("신고하기", action: submit)
            .buttonStyle(.submit(color: .red))
            .disabled(reason == nil)
            .padding()
    }

    private func submit() {
        isDetailFocused = false
    }
}

#Preview("회원 신고") {
    NavigationStack {
        ReportView(nickname: "달리는고양이")
    }
}

#Preview("채팅 신고") {
    NavigationStack {
        ReportView(nickname: "졸린너구리", isChatReport: true)
    }
}
