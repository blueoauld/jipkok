export const PRESS_OPACITY = 0.6;

export const PHOTO_PRESS_OPACITY = 0.8;

export const FLOATING_BUTTON_SIZE = 40;

export const RETRO_BORDER_WIDTH = 2;

export const RETRO_SHADOW_OFFSET = 4;

export const RETRO_SHADOW_OFFSET_SM = 2;

export const OVERLAY_BG = "rgba(0, 0, 0, 0.6)";

export const BOTTOM_BAR_HEIGHT = 64;

// 폼 화면 아래 고정 버튼이 스크롤 내용을 가리지 않게 띄우는 높이다.
export const FORM_FOOTER_HEIGHT = 80;

export const IMAGE_TRANSITION = 200;

export const COVER_IMAGE_STYLE = {
  position: "absolute",
  top: -1,
  bottom: -1,
  left: -1,
  right: -1,
} as const;

export function bottomBarHeight(bottomInset: number) {
  return BOTTOM_BAR_HEIGHT + bottomInset;
}
