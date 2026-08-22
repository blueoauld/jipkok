import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenState } from "@/components/ui/ScreenState";
import { restoreSession } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";

export default function IndexScreen() {
  const { t } = useTranslation();
  const status = useAuthStore((state) => state.status);
  const [failed, setFailed] = useState(false);

  const restore = useCallback(() => {
    restoreSession().catch(() => setFailed(true));
  }, []);

  const retry = () => {
    setFailed(false);
    restore();
  };

  useEffect(() => {
    restore();
  }, [restore]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/main");
    }
  }, [status]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenState
        error={failed}
        message={t("connectFailed")}
        onRetry={retry}
      />
    </SafeAreaView>
  );
}
