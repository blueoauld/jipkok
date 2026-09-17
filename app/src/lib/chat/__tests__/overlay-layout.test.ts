import { layoutActionOverlay } from "@/lib/chat/overlay-layout";

const GAP = 8;
const EDGE = 8;

const window = { width: 400, height: 800 };
const insets = { top: 50, bottom: 30 };
const barHeight = 50;
const menuHeight = 90;

const topLimit = insets.top + EDGE;
const bottomLimit = window.height - insets.bottom - EDGE;

function layout(
  frame: { x: number; y: number; width: number; height: number },
  mine = false,
  reserved: { top?: number; bottom?: number } = {},
) {
  return layoutActionOverlay({
    frame,
    mine,
    barHeight,
    menuHeight,
    window,
    insets,
    reservedTop: reserved.top,
    reservedBottom: reserved.bottom,
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
      y: topLimit + GAP + barHeight - 1,
      width: 200,
      height: 40,
    };

    const result = layout(frame);

    expect(result.barTop).toBe(frame.y + frame.height + GAP);
    expect(result.menuTop).toBe(result.barTop + barHeight + GAP);
  });

  it("아래가 모자라면 메뉴와 반응 바를 둘 다 말풍선 위로 올린다", () => {
    const frame = { x: 20, y: 700, width: 200, height: 40 };

    const result = layout(frame);

    expect(result.barTop).toBe(700 - GAP - barHeight);
    expect(result.menuTop).toBe(result.barTop - GAP - menuHeight);
  });

  it("헤더 높이만큼 위 한계선을 내려 반응 바가 헤더에 닿지 않게 한다", () => {
    const frame = {
      x: 20,
      y: topLimit + GAP + barHeight,
      width: 200,
      height: 40,
    };

    const result = layout(frame, false, { top: 44 });

    expect(result.barTop).toBe(frame.y + frame.height + GAP);
  });

  it("말풍선이 화면 절반보다 크면 위에 자리가 있어도 보이는 부분 가운데에 얹는다", () => {
    const available = bottomLimit - topLimit;
    const frame = {
      x: 20,
      y: topLimit + GAP + barHeight + 20,
      width: 200,
      height: Math.floor(available / 2) + 1,
    };

    const result = layout(frame);

    const blockHeight = barHeight + GAP + menuHeight;
    expect(result.barTop).toBe(
      Math.round((frame.y + frame.y + frame.height - blockHeight) / 2),
    );
    expect(result.menuTop).toBe(result.barTop + barHeight + GAP);
  });

  it("위에는 반응 바만 들어가고 아래에는 메뉴가 안 들어가면 보이는 부분 가운데에 얹는다", () => {
    const frame = {
      x: 20,
      y: topLimit + GAP + barHeight + 20,
      width: 200,
      height: 1200,
    };

    const result = layout(frame);

    const blockHeight = barHeight + GAP + menuHeight;
    expect(result.barTop).toBe(
      Math.round((frame.y + bottomLimit - blockHeight) / 2),
    );
    expect(result.menuTop).toBe(result.barTop + barHeight + GAP);
    expect(result.barTop).toBeGreaterThanOrEqual(topLimit);
  });

  it("아래 한계선에 딱 맞으면 메뉴를 아래에 둔다", () => {
    const frame = {
      x: 20,
      y: bottomLimit - menuHeight - GAP - 40,
      width: 200,
      height: 40,
    };

    const result = layout(frame);

    expect(result.menuTop).toBe(frame.y + frame.height + GAP);
  });

  it("입력창 높이만큼 아래 한계선을 올린다", () => {
    const frame = { x: 20, y: 600, width: 200, height: 40 };

    const result = layout(frame, false, { bottom: 100 });

    expect(result.menuTop).toBe(result.barTop - GAP - menuHeight);
  });

  it("위아래 어디에도 자리가 없으면 말풍선의 보이는 부분 가운데에 바와 메뉴를 얹는다", () => {
    const frame = { x: 20, y: -300, width: 200, height: 1200 };

    const result = layout(frame);

    const blockHeight = barHeight + GAP + menuHeight;
    expect(result.barTop).toBe(
      Math.round((topLimit + bottomLimit - blockHeight) / 2),
    );
    expect(result.menuTop).toBe(result.barTop + barHeight + GAP);
  });

  it("말풍선이 아래로 길게 이어지면 보이는 윗부분 가운데에 얹되 화면 위 한계는 넘지 않는다", () => {
    const frame = { x: 20, y: 100, width: 200, height: 1200 };

    const result = layout(frame);

    const blockHeight = barHeight + GAP + menuHeight;
    expect(result.barTop).toBe(
      Math.round((100 + bottomLimit - blockHeight) / 2),
    );
    expect(result.barTop).toBeGreaterThanOrEqual(topLimit);
  });

  it("내 메시지는 오른쪽, 상대 메시지는 왼쪽 가장자리에 맞춘다", () => {
    const frame = { x: 150, y: 300, width: 200, height: 40 };

    expect(layout(frame, true).side).toEqual({ right: 400 - 150 - 200 });
    expect(layout(frame, false).side).toEqual({ left: 150 });
  });
});
