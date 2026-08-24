import type { ErrorBoundaryProps } from "expo-router";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TamaguiProvider, Text, Theme, useTheme, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { reportError } from "@/lib/crash";
import i18n from "@/lib/i18n";
import { useThemeBackground } from "@/lib/theme/accent";
import { colorScheme, useThemeStore } from "@/lib/theme/store";
import { tamaguiConfig } from "@/tamagui.config";

const ICON_SIZE = 56;

export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const mode = useThemeStore((state) => state.mode);
  const scheme = colorScheme(mode);

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
  const background = useThemeBackground();

  return (
    <YStack flex={1} bg={background}>
      <SafeAreaView style={{ flex: 1 }}>
        <YStack flex={1} justify="center" items="center" gap="$5" p="$6">
          <WarningIcon size={ICON_SIZE} color={theme.red10.val} />

          <YStack gap="$2" items="center">
            <Text fontSize="$6" fontWeight="700" text="center">
              {i18n.t("crash.title")}
            </Text>

            <Text theme="gray" color="$color10" fontSize="$4" text="center">
              {i18n.t("crash.description")}
            </Text>
          </YStack>

          <RetroButton onPress={() => void onRetry()}>
            {i18n.t("component.retry")}
          </RetroButton>
        </YStack>
      </SafeAreaView>
    </YStack>
  );
}
