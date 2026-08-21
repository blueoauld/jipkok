import { renderHook, waitFor } from "@testing-library/react-native";

import { useWorrySearch } from "@/hooks/useWorrySearch";
import { api } from "@/lib/api";

import { createTestQueryClient, withQueryClient } from "./testing";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  api: { worries: { search: jest.fn() } },
}));

const search = api.worries.search as unknown as jest.Mock;

let client: ReturnType<typeof createTestQueryClient>;

beforeEach(() => {
  jest.clearAllMocks();
  client = createTestQueryClient();
  search.mockResolvedValue({
    items: [{ worryId: 1, content: "이직 고민" }],
    nextCursor: null,
  });
});

afterEach(() => client.clear());

describe("useWorrySearch", () => {
  it("공백을 뺀 길이가 2 미만이면 검색하지 않는다", async () => {
    const { result, unmount } = await renderHook(
      () => useWorrySearch("  이 "),
      {
        wrapper: withQueryClient(client),
      },
    );

    expect(result.current.enabled).toBe(false);
    expect(result.current.posts).toEqual([]);
    expect(search).not.toHaveBeenCalled();
    await unmount();
  });

  it("공백을 지운 검색어로 조회하고 결과를 펼쳐 준다", async () => {
    const { result, unmount } = await renderHook(
      () => useWorrySearch(" 이직 "),
      { wrapper: withQueryClient(client) },
    );

    await waitFor(() => expect(result.current.posts).toHaveLength(1));
    expect(search).toHaveBeenCalledWith({ keyword: "이직", cursor: undefined });
    await unmount();
  });

  it("검색어가 짧아지면 이전 결과를 보여 주지 않는다", async () => {
    const { result, rerender, unmount } = await renderHook(
      ({ keyword }: { keyword: string }) => useWorrySearch(keyword),
      { wrapper: withQueryClient(client), initialProps: { keyword: "이직" } },
    );

    await waitFor(() => expect(result.current.posts).toHaveLength(1));

    await rerender({ keyword: "이" });

    expect(result.current.enabled).toBe(false);
    expect(result.current.posts).toEqual([]);
    await unmount();
  });
});
