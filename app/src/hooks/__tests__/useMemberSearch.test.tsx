import { renderHook, waitFor } from "@testing-library/react-native";

import { useMemberSearch } from "@/hooks/useMemberSearch";
import { api } from "@/lib/api";

import { createTestQueryClient, withQueryClient } from "./testing";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  api: { members: { search: jest.fn() } },
}));

const search = api.members.search as unknown as jest.Mock;

let client: ReturnType<typeof createTestQueryClient>;

beforeEach(() => {
  jest.clearAllMocks();
  client = createTestQueryClient();
  search.mockResolvedValue({
    items: [{ memberId: 1, nickname: "수완" }],
    nextCursor: null,
  });
});

afterEach(() => client.clear());

describe("useMemberSearch", () => {
  it("공백을 뺀 길이가 2 미만이면 검색하지 않는다", async () => {
    const { result, unmount } = await renderHook(
      () => useMemberSearch("  a "),
      { wrapper: withQueryClient(client) },
    );

    expect(result.current.enabled).toBe(false);
    expect(result.current.members).toEqual([]);
    expect(search).not.toHaveBeenCalled();
    await unmount();
  });

  it("공백을 지운 검색어로 조회하고 결과를 펼쳐 준다", async () => {
    const { result, unmount } = await renderHook(
      () => useMemberSearch(" 수완 "),
      { wrapper: withQueryClient(client) },
    );

    await waitFor(() => expect(result.current.members).toHaveLength(1));
    expect(search).toHaveBeenCalledWith({ keyword: "수완", cursor: undefined });
    await unmount();
  });

  it("검색어가 짧아지면 이전 결과를 보여 주지 않는다", async () => {
    const { result, rerender, unmount } = await renderHook(
      ({ keyword }: { keyword: string }) => useMemberSearch(keyword),
      { wrapper: withQueryClient(client), initialProps: { keyword: "수완" } },
    );

    await waitFor(() => expect(result.current.members).toHaveLength(1));

    await rerender({ keyword: "수" });

    expect(result.current.enabled).toBe(false);
    expect(result.current.members).toEqual([]);
    await unmount();
  });
});
