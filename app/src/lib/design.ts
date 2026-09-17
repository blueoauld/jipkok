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

// 남은 초와 "전송"이 번갈아 들어가도 폭이 흔들리지 않을 만큼이다. 고정 폭이 아니라
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

// 토스 디자인 시스템(TDS) 버튼에서 잰 크기별 치수다. 높이는 최소 높이라 큰 글씨에서는 늘어난다.
export const BUTTON_SIZES = {
  small: {
    height: 32,
    radius: 8,
    paddingX: 10,
    paddingY: 2,
    minWidth: 52,
    fontSize: "$1",
    dotSize: 5,
    dotGap: 3,
  },
  medium: {
    height: 38,
    radius: 10,
    paddingX: 16,
    paddingY: 2,
    minWidth: 64,
    fontSize: "$2",
    dotSize: 5,
    dotGap: 4,
  },
  large: {
    height: 48,
    radius: 14,
    paddingX: 16,
    paddingY: 2,
    minWidth: 80,
    fontSize: "$4",
    dotSize: 8,
    dotGap: 5,
  },
  xlarge: {
    height: 56,
    radius: 16,
    paddingX: 28,
    paddingY: 15,
    minWidth: 96,
    fontSize: "$4",
    dotSize: 8,
    dotGap: 7,
  },
} as const;

export const BUTTON_DISABLED_OPACITY = 0.3;

export const INPUT_HEIGHT = 56;

export const INPUT_RADIUS = 14;

export const SEGMENT_HEIGHT = 48;

export const SEGMENT_RADIUS = 14;

export const SEGMENT_ITEM_HEIGHT = 40;

export const SEGMENT_ITEM_RADIUS = 10;

export const BADGE_HEIGHT = 24;

export const BADGE_RADIUS = 11;

// TDS에는 카드가 없어서 가장 큰 버튼과 같은 모서리로 정했다.
export const CARD_RADIUS = 16;

export const DIALOG_WIDTH = 320;

export const DIALOG_RADIUS = 24;

export const SHEET_RADIUS = 28;

export const SHEET_PADDING_X = 24;

export const PILL_RADIUS = 9999;

// 화면 좌우 여백이다. space $4(18)는 요소 사이 간격에도 쓰여서 값을 바꾸지 않고 따로 둔다.
export const SCREEN_PADDING = 20;

export const LIST_ROW_VERTICAL_PADDING = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
} as const;

// 흰 화면에서 묶음과 묶음 사이를 가르는 회색 띠의 높이다.
export const SECTION_DIVIDER_HEIGHT = 16;

export const PRESS_DIM = "rgba(0, 0, 0, 0.1)";

// TDS dark 채움(버튼, elephant 배지)의 색이다. $grey700은 다크에서 밝아지므로 라이트 값을 고정한다.
export const DARK_FILL = "#4E5968";

export const FLOATING_SHADOW = "0 2px 30px rgba(0, 27, 55, 0.1)";
