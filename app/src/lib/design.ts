export const PRESS_OPACITY = 0.6;

export const PHOTO_PRESS_OPACITY = 0.8;

export const DISABLED_OPACITY = 0.6;

export const SHEET_OVERLAY_OPACITY = 0.6;

export const OVERLAY_BG = "rgba(0, 0, 0, 0.5)";

export const TAB_BAR_HEIGHT = 64;

export const TAB_BAR_BOTTOM_GAP = 12;

export function tabBarOverlayHeight(bottomInset: number) {
  return TAB_BAR_HEIGHT + Math.max(bottomInset, TAB_BAR_BOTTOM_GAP);
}
