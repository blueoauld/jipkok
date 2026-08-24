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

// expo-router는 라우트 파일이 내보낸 ErrorBoundary만 붙인다. 그래서 이 컴포넌트는
// _layout.tsx 세 곳에서 내보내지고, 지우면 그 구간은 조용히 무방비가 된다.
//
// 그룹 레이아웃에서 잡히면 루트가 살아남아 쿼리 캐시가 유지되고, 루트에서 잡히면
// 라우트 컴포넌트 자체가 대체되어 프로바이더가 없다. 후자를 위해 Tamagui를 여기서
// 다시 세우고 번역도 훅 대신 인스턴스로 읽는다. SafeAreaProvider는 ExpoRoot가 라우트
// 트리 위에 두므로 두 경우 모두 살아 있다.
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
