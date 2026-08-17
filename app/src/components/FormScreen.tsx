import type { ComponentProps, ReactNode } from "react";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTokens, YStack } from "tamagui";

import { FORM_FOOTER_HEIGHT } from "@/lib/design";
import { useThemeBackground } from "@/lib/theme/accent";

const KEYBOARD_OVERLAP = 2;

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

  return (
    <>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        mode={scrollMode}
        bottomOffset={FORM_FOOTER_HEIGHT}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" p="$4" pb={FORM_FOOTER_HEIGHT}>
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
        >
          {footer}
        </YStack>
      </KeyboardStickyView>
    </>
  );
}
