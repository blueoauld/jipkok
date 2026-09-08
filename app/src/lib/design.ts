export const PRESS_OPACITY = 0.6;

export const DISABLED_OPACITY = 0.4;

export const PHOTO_PRESS_OPACITY = 0.8;

// 애플이 권하는 최소 탭 영역이다. 손가락이 닿는 면이라 더 줄이지 말 것.
export const MIN_TAP_SIZE = 44;

export const FLOATING_BUTTON_SIZE = MIN_TAP_SIZE;

export const SCROLL_TO_TOP_BOTTOM_GAP = 18;

// 목록의 좌우 여백(space $4)과 같아야 떠 있는 버튼이 카드 테두리에 맞는다.
export const SCROLL_TO_TOP_SIDE_GAP = 18;

// iOS가 직접 그리는 네이티브 뒤로가기 버튼과 같은 지름이라야 화면을 옮겨 다녀도 안 튄다.
export const HEADER_GLASS_SIZE = 44;

export const HEADER_GLASS_GAP = 8;

// 잠금, 정지, 오류처럼 화면 전체를 차지하는 안내의 아이콘 크기.
export const STATUS_ICON_SIZE = 56;

// 스피너, 남은 초, "전송"이 번갈아 들어가도 폭이 흔들리지 않을 만큼이다. 고정 폭이 아니라
// 최소 폭인 이유는 글씨 크기를 키운 사용자에게 글자가 잘리면 안 되기 때문이다.
export const SEND_CODE_BUTTON_MIN_WIDTH = 80;

export const COUNTRY_BUTTON_MIN_WIDTH = 70;

export const RETRO_BORDER_WIDTH = 2;

export const RETRO_SHADOW_OFFSET = 4;

export const RETRO_SHADOW_OFFSET_SM = 2;

export const OVERLAY_BG = "rgba(0, 0, 0, 0.6)";

// 사진, 영상, 어두운 오버레이 위의 글자와 아이콘 색이다. 테마를 타지 않는다.
// 테마 색 채움 위의 흰 글씨는 이게 아니라 테마 토큰 $onFill이다.
export const OVERLAY_INK = "white";

// 시트, 다이얼로그, 토스트가 같은 스프링으로 움직이게 하는 프리셋 이름이다.
export const TRANSITION = "quickLessBouncy";

// 다이얼로그가 나타나고 사라질 때 시작하는 크기다.
export const DIALOG_ENTER_SCALE = 0.95;

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

export const BOTTOM_BAR_HEIGHT = 64;

export function bottomBarHeight(bottomInset: number) {
  return BOTTOM_BAR_HEIGHT + bottomInset;
}

// 유리 바만 화면을 가로지르지 않고 가장자리에서 띄운다. 레트로 바는 흐름 안에 있다.
export const FLOATING_BAR_HEIGHT = 56;

const FLOATING_BAR_SIDE_GAP = 32;

const FLOATING_BAR_BOTTOM_GAP = 8;

export const FLOATING_BAR_RADIUS = FLOATING_BAR_HEIGHT / 2;

export function floatingBarHeight(bottomInset: number) {
  return FLOATING_BAR_HEIGHT + FLOATING_BAR_BOTTOM_GAP + bottomInset;
}

// 탭 바와 프로필 액션 바가 같은 자리에 서야 화면을 오갈 때 바가 튀지 않는다.
// left/right로 밀면 여백이 안 먹어서 상자를 줄이는 쪽으로 낸다.
export function floatingBarStyle(bottomInset: number) {
  return {
    position: "absolute",
    left: 0,
    right: 0,
    marginHorizontal: FLOATING_BAR_SIDE_GAP,
    bottom: bottomInset + FLOATING_BAR_BOTTOM_GAP,
    height: FLOATING_BAR_HEIGHT,
  } as const;
}
