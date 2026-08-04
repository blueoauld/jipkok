import { getAnalytics, logScreenView } from "@react-native-firebase/analytics";
import { useSegments } from "expo-router";
import { useEffect } from "react";

import { ANALYTICS_ENABLED } from "@/lib/analytics";

function toScreenName(segments: string[]) {
  const path = segments.filter((segment) => !segment.startsWith("(")).join("/");

  return path ? `/${path}` : "/";
}

export function useScreenTracking() {
  const segments = useSegments();
  const name = toScreenName([...segments]);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) {
      return;
    }

    logScreenView(getAnalytics(), {
      screen_name: name,
      screen_class: name,
    }).catch(() => undefined);
  }, [name]);
}
