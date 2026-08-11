export const PRESS_OPACITY = 0.6;

export const PHOTO_PRESS_OPACITY = 0.8;

export const DISABLED_OPACITY = 0.6;

export const RETRO_SHADOW_OFFSET = 4;

export const RETRO_SHADOW_OFFSET_SM = 2;

export const OVERLAY_BG = "rgba(0, 0, 0, 0.6)";

export const TAB_BAR_HEIGHT = 64;

const TAB_BAR_BOTTOM_GAP = 12;

function tabBarBottom(bottomInset: number) {
  return bottomInset + TAB_BAR_BOTTOM_GAP;
}

export function tabBarOverlayHeight(bottomInset: number) {
  return TAB_BAR_HEIGHT + tabBarBottom(bottomInset);
}
