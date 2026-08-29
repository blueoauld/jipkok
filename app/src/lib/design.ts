export const PRESS_OPACITY = 0.6;

export const DISABLED_OPACITY = 0.4;

export const PHOTO_PRESS_OPACITY = 0.8;

export const FLOATING_BUTTON_SIZE = 40;

// iOS가 직접 그리는 네이티브 뒤로가기 버튼과 같은 지름이라야 화면을 옮겨 다녀도 안 튄다.
export const HEADER_GLASS_SIZE = 44;

export const HEADER_GLASS_GAP = 8;

// 스피너, 남은 초, "전송"이 번갈아 들어가도 폭이 흔들리지 않을 만큼이다.
export const SEND_CODE_BUTTON_WIDTH = 80;

export const COUNTRY_BUTTON_WIDTH = 70;

export const RETRO_BORDER_WIDTH = 2;

export const RETRO_SHADOW_OFFSET = 4;

export const RETRO_SHADOW_OFFSET_SM = 2;

export const OVERLAY_BG = "rgba(0, 0, 0, 0.6)";

export const BOTTOM_BAR_HEIGHT = 64;

// 폼 화면 아래 고정 버튼이 스크롤 내용을 가리지 않게 띄우는 높이다.
export const FORM_FOOTER_HEIGHT = 80;

// 키보드 위에 붙는 줄을 이만큼 겹쳐야 둘 사이에 실선 같은 틈이 안 보인다.
export const KEYBOARD_OVERLAP = 2;

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
