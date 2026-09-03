import { RETRO_SHADOW_OFFSET } from "@/lib/design";

const GAP = 6 + RETRO_SHADOW_OFFSET;
const EDGE_MARGIN = 8;

export type MessageFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OverlayLayout = {
  barTop: number;
  menuTop: number;
  side: { left: number } | { right: number };
};

// 반응 바는 말풍선 위, 메뉴는 그 아래가 기본이다. 한쪽이 모자라면 둘 다 반대쪽으로 넘긴다.
// 말풍선이 화면 절반보다 크면 손가락이 어디 있든 멀어지므로, 위아래를 따지지 않고
// 한 덩어리로 말풍선의 보이는 부분 가운데에 얹는다.
export function layoutActionOverlay({
  frame,
  mine,
  barHeight,
  menuHeight,
  window,
  insets,
  reservedTop = 0,
  reservedBottom = 0,
}: {
  frame: MessageFrame;
  mine: boolean;
  barHeight: number;
  menuHeight: number;
  window: { width: number; height: number };
  insets: { top: number; bottom: number };
  reservedTop?: number;
  reservedBottom?: number;
}): OverlayLayout {
  const topLimit = insets.top + reservedTop + EDGE_MARGIN;
  const bottomLimit =
    window.height - insets.bottom - reservedBottom - EDGE_MARGIN;
  const frameBottom = frame.y + frame.height;
  const blockHeight = barHeight + GAP + menuHeight;

  const side = mine
    ? { right: window.width - frame.x - frame.width }
    : { left: frame.x };

  const centerOnVisible = () => {
    const visibleTop = Math.max(frame.y, topLimit);
    const visibleBottom = Math.min(frameBottom, bottomLimit);
    const centered = Math.round((visibleTop + visibleBottom - blockHeight) / 2);
    const barTop = Math.min(
      Math.max(centered, topLimit),
      bottomLimit - blockHeight,
    );

    return { barTop, menuTop: barTop + barHeight + GAP, side };
  };

  if (frame.height > (bottomLimit - topLimit) / 2) {
    return centerOnVisible();
  }

  const barAbove = frame.y - GAP - barHeight >= topLimit;
  const menuBelow = frameBottom + GAP + menuHeight <= bottomLimit;

  if (barAbove && menuBelow) {
    return {
      barTop: frame.y - GAP - barHeight,
      menuTop: frameBottom + GAP,
      side,
    };
  }

  if (frameBottom + GAP + blockHeight <= bottomLimit) {
    const barTop = frameBottom + GAP;

    return { barTop, menuTop: barTop + barHeight + GAP, side };
  }

  if (frame.y - GAP - blockHeight >= topLimit) {
    const menuTop = frame.y - GAP - blockHeight;

    return { barTop: menuTop + menuHeight + GAP, menuTop, side };
  }

  return centerOnVisible();
}
