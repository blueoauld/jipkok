import { renderHook } from "@testing-library/react-native";

import { usePagedList } from "@/hooks/usePagedList";

// tamagui는 jest가 변환하지 않는 ESM이라 목록 여백에 쓰는 토큰만 대신 채운다.
jest.mock("tamagui", () => {
  const space = { val: 8 };

  return {
    getTokens: () => ({ space: { $2: space, $4: space } }),
    Spinner: () => null,
    YStack: () => null,
  };
});

function setup(query: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError?: boolean;
  fetchNextPage: () => unknown;
}) {
  return renderHook(() =>
    usePagedList({ isFetchNextPageError: false, ...query }),
  );
}

describe("usePagedList", () => {
  it("다음 장이 있으면 끝에 닿을 때 더 받는다", async () => {
    const fetchNextPage = jest.fn();
    const { result, unmount } = await setup({
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    });

    result.current.onEndReached();

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("다음 장이 없으면 더 받지 않는다", async () => {
    const fetchNextPage = jest.fn();
    const { result, unmount } = await setup({
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage,
    });

    result.current.onEndReached();

    expect(fetchNextPage).not.toHaveBeenCalled();
    await unmount();
  });

  it("이미 받는 중이면 또 받지 않는다", async () => {
    const fetchNextPage = jest.fn();
    const { result, unmount } = await setup({
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage,
    });

    result.current.onEndReached();

    expect(fetchNextPage).not.toHaveBeenCalled();
    await unmount();
  });

  it("다음 장 받기가 실패했으면 끝에 닿아도 다시 받지 않는다", async () => {
    const fetchNextPage = jest.fn();
    const { result, unmount } = await setup({
      hasNextPage: true,
      isFetchingNextPage: false,
      isFetchNextPageError: true,
      fetchNextPage,
    });

    result.current.onEndReached();

    expect(fetchNextPage).not.toHaveBeenCalled();
    await unmount();
  });

  it("다음 장 받기가 실패했으면 아래에 다시 시도를 둔다", async () => {
    const { result, unmount } = await setup({
      hasNextPage: true,
      isFetchingNextPage: false,
      isFetchNextPageError: true,
      fetchNextPage: jest.fn(),
    });

    expect(result.current.ListFooterComponent).not.toBeNull();
    await unmount();
  });

  it("받는 중일 때만 아래에 spinner를 둔다", async () => {
    const { result, rerender, unmount } = await renderHook(
      ({ fetching }: { fetching: boolean }) =>
        usePagedList({
          hasNextPage: true,
          isFetchingNextPage: fetching,
          isFetchNextPageError: false,
          fetchNextPage: jest.fn(),
        }),
      { initialProps: { fetching: false } },
    );

    expect(result.current.ListFooterComponent).toBeNull();

    await rerender({ fetching: true });

    expect(result.current.ListFooterComponent).not.toBeNull();
    await unmount();
  });
});
