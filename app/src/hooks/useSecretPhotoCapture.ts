import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";

import { alertInfo } from "@/lib/alert";
import { useCaptureNoticeStore } from "@/lib/secret-photo/store";

const CAPTURE_KEY = "secret-photo";

const NOTICE_MESSAGE =
  "화면을 녹화하거나 캡처하면 사진이 보이지 않습니다.\n다른 기기로 촬영하면 이용이 정지될 수 있습니다.";

export function useSecretPhotoCapture(active: boolean) {
  const seen = useCaptureNoticeStore((state) => state.seen);
  const markSeen = useCaptureNoticeStore((state) => state.markSeen);

  useEffect(() => {
    if (!active) {
      return;
    }

    ScreenCapture.preventScreenCaptureAsync(CAPTURE_KEY).catch(() => undefined);

    return () => {
      ScreenCapture.allowScreenCaptureAsync(CAPTURE_KEY).catch(() => undefined);
    };
  }, [active]);

  useEffect(() => {
    if (!active || seen) {
      return;
    }

    markSeen();
    alertInfo(NOTICE_MESSAGE);
  }, [active, markSeen, seen]);
}
