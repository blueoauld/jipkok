import { renderHook } from "@testing-library/react-native";

import { usePagedList } from "@/hooks/usePagedList";

// tamagui는 jest가 변환하지 않는 ESM이라 목록 끝에 그리는 부품을 비운다. ErrorState는 Tamagui 바벨
// 플러그인이 글자를 펼치면서 @tamagui/core를 직접 불러오게 바꾸므로 따로 비운다.
jest.mock("tamagui", () => ({
  Spinner: () => null,
  YStack: () => null,
}));

jest.mock("@/components/ui/ErrorState", () => ({
  ErrorState: () => null,
}));

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
