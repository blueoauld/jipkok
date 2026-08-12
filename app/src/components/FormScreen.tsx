import type { ComponentProps, ReactNode } from "react";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { FORM_FOOTER_HEIGHT } from "@/lib/design";

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
        <YStack px="$4" py="$4" bg="$background">
          {footer}
        </YStack>
      </KeyboardStickyView>
    </>
  );
}
