import { renderHook, waitFor } from "@testing-library/react-native";

import { useDiarySearch } from "@/hooks/useDiarySearch";
import { api } from "@/lib/api";

import { createTestQueryClient, withQueryClient } from "./testing";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  api: { diaries: { search: jest.fn() } },
}));

const search = api.diaries.search as unknown as jest.Mock;

let client: ReturnType<typeof createTestQueryClient>;

beforeEach(() => {
  jest.clearAllMocks();
  client = createTestQueryClient();
  search.mockResolvedValue({
    items: [{ entryDate: "2026-09-09", content: "오늘은 집", attachments: [] }],
    nextCursor: null,
  });
});

afterEach(() => client.clear());

describe("useDiarySearch", () => {
  it("공백을 뺀 길이가 2 미만이면 검색하지 않는다", async () => {
    const { result, unmount } = await renderHook(() => useDiarySearch(" 집 "), {
      wrapper: withQueryClient(client),
    });

    expect(result.current.enabled).toBe(false);
    expect(result.current.diaries).toEqual([]);
    expect(search).not.toHaveBeenCalled();
    await unmount();
  });

  it("공백을 지운 검색어로 조회하고 결과를 펼쳐 준다", async () => {
    const { result, unmount } = await renderHook(
      () => useDiarySearch(" 오늘 "),
      {
        wrapper: withQueryClient(client),
      },
    );

    await waitFor(() => expect(result.current.diaries).toHaveLength(1));
    expect(search).toHaveBeenCalledWith({ keyword: "오늘", cursor: undefined });
    await unmount();
  });
});
