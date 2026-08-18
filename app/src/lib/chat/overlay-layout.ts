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

// 반응 바는 말풍선 위, 메뉴는 그 아래가 기본이고, 화면을 벗어나면 반대쪽으로 넘긴다.
export function layoutActionOverlay({
  frame,
  mine,
  barHeight,
  menuHeight,
  window,
  insets,
}: {
  frame: MessageFrame;
  mine: boolean;
  barHeight: number;
  menuHeight: number;
  window: { width: number; height: number };
  insets: { top: number; bottom: number };
}): OverlayLayout {
  const topLimit = insets.top + EDGE_MARGIN;
  const bottomLimit = window.height - insets.bottom - EDGE_MARGIN;

  const barAbove = frame.y - GAP - barHeight >= topLimit;
  const barTop = barAbove
    ? frame.y - GAP - barHeight
    : frame.y + frame.height + GAP;

  const belowBar = barAbove
    ? frame.y + frame.height + GAP
    : barTop + barHeight + GAP;
  const menuFits = belowBar + menuHeight <= bottomLimit;
  const menuTop = menuFits ? belowBar : barTop - GAP - menuHeight;

  const side = mine
    ? { right: window.width - frame.x - frame.width }
    : { left: frame.x };

  return { barTop, menuTop, side };
}
