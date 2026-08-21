import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useState,
} from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTokens, YStack } from "tamagui";

import { FORM_FOOTER_HEIGHT, KEYBOARD_OVERLAP } from "@/lib/design";
import { useThemeBackground } from "@/lib/theme/accent";

type ScrollMode = ComponentProps<typeof KeyboardAwareScrollView>["mode"];

export function FormScreen({
  scrollMode,
  footer,
  children,
}: {
  scrollMode?: ScrollMode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const background = useThemeBackground();
  const [footerHeight, setFooterHeight] = useState(FORM_FOOTER_HEIGHT);

  const measureFooter = useCallback(
    (event: LayoutChangeEvent) =>
      setFooterHeight(event.nativeEvent.layout.height),
    [],
  );

  return (
    <>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        mode={scrollMode}
        bottomOffset={footerHeight}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" p="$4" pb={footerHeight}>
          {children}
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack
          px="$4"
          pt="$4"
          pb={getTokens().space.$4.val + KEYBOARD_OVERLAP}
          mb={-KEYBOARD_OVERLAP}
          bg={background}
          onLayout={measureFooter}
        >
          {footer}
        </YStack>
      </KeyboardStickyView>
    </>
  );
}
