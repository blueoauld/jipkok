import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { PHOTO_PERMISSION_MESSAGE } from "@/lib/message";
import { saveChatMedia } from "@/lib/photo";
import { showToast } from "@/lib/toast/store";

const COPIED_MESSAGE = "메시지를 복사했습니다.";

const SAVED_MESSAGE = {
  photo: "사진을 저장했습니다.",
  video: "동영상을 저장했습니다.",
};
const SAVE_FAILED_MESSAGE = {
  photo: "사진을 저장하지 못했습니다.",
  video: "동영상을 저장하지 못했습니다.",
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
      showToast("error", PHOTO_PERMISSION_MESSAGE);
    }
  } catch {
    showToast("error", SAVE_FAILED_MESSAGE[kind]);
  }
}
