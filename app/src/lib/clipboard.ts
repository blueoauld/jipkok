import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { showToast } from "@/lib/toast/store";

export async function copyText(text: string, message: string) {
  if (!text) {
    return;
  }

  await Clipboard.setStringAsync(text);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  showToast("info", message);
}
