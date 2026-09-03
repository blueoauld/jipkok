import { clearChatDraft, useChatDraftStore } from "@/lib/chat/draft-store";

beforeEach(() => useChatDraftStore.setState({ drafts: {} }));

describe("useChatDraftStore", () => {
  it("방마다 따로 저장한다", () => {
    useChatDraftStore.getState().set(1, "안녕");
    useChatDraftStore.getState().set(2, "반가워");

    expect(useChatDraftStore.getState().drafts).toEqual({
      1: "안녕",
      2: "반가워",
    });
  });

  it("빈 글을 저장하면 그 방의 초안을 지운다", () => {
    useChatDraftStore.getState().set(1, "안녕");
    useChatDraftStore.getState().set(1, "");

    expect(useChatDraftStore.getState().drafts).toEqual({});
  });

  it("지우면 다른 방의 초안은 남긴다", () => {
    useChatDraftStore.getState().set(1, "안녕");
    useChatDraftStore.getState().set(2, "반가워");

    clearChatDraft(1);

    expect(useChatDraftStore.getState().drafts).toEqual({ 2: "반가워" });
  });

  it("전부 지우면 아무것도 남지 않는다", () => {
    useChatDraftStore.getState().set(1, "안녕");
    useChatDraftStore.getState().set(2, "반가워");

    useChatDraftStore.getState().clearAll();

    expect(useChatDraftStore.getState().drafts).toEqual({});
  });
});
