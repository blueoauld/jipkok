import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import i18n from "@/lib/i18n";
import { photoPermissionMessage } from "@/lib/message";
import { saveChatMedia } from "@/lib/photo";
import { showToast } from "@/lib/toast/store";

const COPIED_MESSAGE = i18n.t("media.copied");

const SAVED_MESSAGE = {
  photo: i18n.t("media.photoSaved"),
  video: i18n.t("media.videoSaved"),
};
const SAVE_FAILED_MESSAGE = {
  photo: i18n.t("media.photoSaveFailed"),
  video: i18n.t("media.videoSaveFailed"),
};

export type MediaKind = keyof typeof SAVED_MESSAGE;

export async function copyMessage(content: string) {
  if (!content) {
    return;
  }

  await Clipboard.setStringAsync(content);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  showToast("info", COPIED_MESSAGE);
}

export async function saveMedia(url: string, kind: MediaKind) {
  try {
    if (await saveChatMedia(url)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast("info", SAVED_MESSAGE[kind]);
    } else {
      showToast("error", photoPermissionMessage());
    }
  } catch {
    showToast("error", SAVE_FAILED_MESSAGE[kind]);
  }
}
