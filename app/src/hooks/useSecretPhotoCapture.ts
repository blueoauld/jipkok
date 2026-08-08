import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";

const CAPTURE_KEY = "secret-photo";

export function useSecretPhotoCapture(active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }

    ScreenCapture.preventScreenCaptureAsync(CAPTURE_KEY).catch(() => undefined);

    return () => {
      ScreenCapture.allowScreenCaptureAsync(CAPTURE_KEY).catch(() => undefined);
    };
  }, [active]);
}
