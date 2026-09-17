import type { ErrorBoundaryProps } from "expo-router";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TamaguiProvider, Theme, useTheme, YStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import { StatusDescription, StatusScreen } from "@/components/ui/StatusScreen";
import { reportError } from "@/lib/crash";
import { STATUS_ICON_SIZE } from "@/lib/design";
import i18n from "@/lib/i18n";
import { useThemeStore } from "@/lib/theme/store";
import { tamaguiConfig } from "@/tamagui.config";

export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const scheme = useThemeStore((state) => state.mode);

  useEffect(() => {
    reportError("render", error);
  }, [error]);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Theme name={scheme}>
        <Content onRetry={retry} />
      </Theme>
    </TamaguiProvider>
  );
}

function Content({ onRetry }: { onRetry: () => Promise<void> }) {
  const theme = useTheme();

  return (
    <YStack flex={1} bg="$background">
      <SafeAreaView style={{ flex: 1 }}>
        <StatusScreen
          icon={<WarningIcon size={STATUS_ICON_SIZE} color={theme.red10.val} />}
          title={i18n.t("crash.title")}
          description={
            <StatusDescription>{i18n.t("crash.description")}</StatusDescription>
          }
        >
          <Button onPress={() => void onRetry()}>
            {i18n.t("component.retry")}
          </Button>
        </StatusScreen>
      </SafeAreaView>
    </YStack>
  );
}
