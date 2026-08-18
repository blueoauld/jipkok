import type { InfiniteData } from "@tanstack/react-query";

import { flattenPages, mapPages } from "@/lib/paging";

type Page = { items: number[]; nextCursor: number | null };

const data: InfiniteData<Page> = {
  pages: [
    { items: [1, 2], nextCursor: 2 },
    { items: [3], nextCursor: null },
  ],
  pageParams: [undefined, 2],
};

describe("paging", () => {
  it("모든 페이지의 items를 편다", () => {
    expect(flattenPages(data)).toEqual([1, 2, 3]);
    expect(flattenPages(undefined)).toBeUndefined();
  });

  it("items만 바꾸고 나머지 페이지 정보는 유지한다", () => {
    const mapped = mapPages(data, (items, index) =>
      index === 0 ? [0, ...items] : items,
    );

    expect(mapped?.pages[0]).toEqual({ items: [0, 1, 2], nextCursor: 2 });
    expect(mapped?.pages[1]).toEqual(data.pages[1]);
    expect(mapped?.pageParams).toEqual(data.pageParams);
    expect(mapPages(undefined, (items) => items)).toBeUndefined();
  });
});
