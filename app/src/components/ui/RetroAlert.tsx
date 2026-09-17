import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Platform, Text as NativeText } from "react-native";
import { AnimatePresence, Text, useTheme, XStack, YStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import { RetroShadow } from "@/components/ui/RetroShadow";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import {
  DIALOG_ENTER_SCALE,
  OVERLAY_BG,
  RETRO_BORDER_WIDTH,
  TRANSITION,
} from "@/lib/design";

const MONO_FONT = Platform.select({ ios: "Menlo", default: "monospace" });

const VARIANTS = {
  error: { label: "ERROR.EXE", barColor: "$red10", onFill: true },
  info: { label: "INFO.EXE", barColor: "$blue10", onFill: true },
  warning: { label: "WARNING.EXE", barColor: "$yellow10", onFill: false },
} as const;

export type RetroAlertVariant = keyof typeof VARIANTS;

export function RetroAlert({
  visible: requested,
  variant = "error",
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  variant?: RetroAlertVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const visible = useVisibleWhenUnlocked(requested);
  // 나가는 전환이 끝날 때까지 Modal을 붙들어 둔다.
  const [mounted, setMounted] = useState(visible);

  if (visible && !mounted) {
    setMounted(true);
  }

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
    >
      <AnimatePresence onExitComplete={() => setMounted(false)}>
        {visible && (
          <YStack
            key="alert"
            flex={1}
            bg={OVERLAY_BG}
            justify="center"
            p="$4"
            opacity={1}
            transition={TRANSITION}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          >
            <YStack
              scale={1}
              transition={TRANSITION}
              enterStyle={{ scale: DIALOG_ENTER_SCALE }}
              exitStyle={{ scale: DIALOG_ENTER_SCALE }}
            >
              <RetroShadow color="$gray12" />

              <YStack borderWidth={RETRO_BORDER_WIDTH} borderColor="$gray12">
                <XStack
                  bg={VARIANTS[variant].barColor}
                  px="$3"
                  py="$2.5"
                  items="center"
                  borderBottomWidth={RETRO_BORDER_WIDTH}
                  borderColor="$gray12"
                >
                  <NativeText
                    style={{
                      flex: 1,
                      fontFamily: MONO_FONT,
                      fontWeight: "700",
                      fontSize: 18,
                      color: VARIANTS[variant].onFill
                        ? theme.onFill.val
                        : "black",
                    }}
                  >
                    {VARIANTS[variant].label}
                  </NativeText>
                </XStack>

                <YStack bg="$color1">
                  <YStack p="$4" gap="$2">
                    <Text fontSize="$6" fontWeight="700" color="$color12">
                      {title}
                    </Text>
                    <Text color="$color12" fontSize="$4">
                      {message}
                    </Text>
                  </YStack>

                  <YStack mx="$4" borderWidth={1} borderColor="$color8" />

                  {confirmLabel ? (
                    <XStack p="$4" gap="$3">
                      <Button flex={1} variant="secondary" onPress={onClose}>
                        {t("component.close")}
                      </Button>

                      <Button
                        flex={1}
                        variant={destructive ? "danger" : "primary"}
                        onPress={() => {
                          onClose();
                          onConfirm?.();
                        }}
                      >
                        {confirmLabel}
                      </Button>
                    </XStack>
                  ) : (
                    <XStack justify="flex-end" p="$4">
                      <Button variant="secondary" onPress={onClose}>
                        {t("component.confirm")}
                      </Button>
                    </XStack>
                  )}
                </YStack>
              </YStack>
            </YStack>
          </YStack>
        )}
      </AnimatePresence>
    </Modal>
  );
}
