import { layoutActionOverlay } from "@/lib/chat/overlay-layout";
import { RETRO_SHADOW_OFFSET } from "@/lib/design";

const GAP = 6 + RETRO_SHADOW_OFFSET;
const EDGE = 8;

const window = { width: 400, height: 800 };
const insets = { top: 50, bottom: 30 };
const barHeight = 50;
const menuHeight = 90;

function layout(
  frame: { x: number; y: number; width: number; height: number },
  mine = false,
) {
  return layoutActionOverlay({
    frame,
    mine,
    barHeight,
    menuHeight,
    window,
    insets,
  });
}

describe("layoutActionOverlay", () => {
  it("여유가 있으면 반응 바는 말풍선 위, 메뉴는 아래에 둔다", () => {
    const frame = { x: 20, y: 300, width: 200, height: 40 };

    const result = layout(frame);

    expect(result.barTop).toBe(300 - GAP - barHeight);
    expect(result.menuTop).toBe(300 + 40 + GAP);
  });

  it("위가 모자라면 반응 바를 말풍선 아래로, 메뉴를 그 밑으로 내린다", () => {
    const frame = {
      x: 20,
      y: insets.top + EDGE + GAP + barHeight - 1,
      width: 200,
      height: 40,
    };

    const result = layout(frame);

    expect(result.barTop).toBe(frame.y + frame.height + GAP);
    expect(result.menuTop).toBe(result.barTop + barHeight + GAP);
  });

  it("아래가 모자라면 메뉴를 반응 바 위로 올린다", () => {
    const frame = { x: 20, y: 700, width: 200, height: 40 };

    const result = layout(frame);

    expect(result.barTop).toBe(700 - GAP - barHeight);
    expect(result.menuTop).toBe(result.barTop - GAP - menuHeight);
  });

  it("아래 한계선에 딱 맞으면 메뉴를 아래에 둔다", () => {
    const bottomLimit = window.height - insets.bottom - EDGE;
    const frame = {
      x: 20,
      y: bottomLimit - menuHeight - GAP - 40,
      width: 200,
      height: 40,
    };

    const result = layout(frame);

    expect(result.menuTop).toBe(frame.y + frame.height + GAP);
  });

  it("내 메시지는 오른쪽, 상대 메시지는 왼쪽 가장자리에 맞춘다", () => {
    const frame = { x: 150, y: 300, width: 200, height: 40 };

    expect(layout(frame, true).side).toEqual({ right: 400 - 150 - 200 });
    expect(layout(frame, false).side).toEqual({ left: 150 });
  });
});
