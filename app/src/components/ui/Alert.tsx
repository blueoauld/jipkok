import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "react-native";
import { AnimatePresence, Text, XStack, YStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import {
  DIALOG_ENTER_SCALE,
  DIALOG_RADIUS,
  DIALOG_WIDTH,
  PRESS_DIM,
  SCREEN_PADDING,
  TRANSITION,
} from "@/lib/design";

// TDS 다이얼로그에서 잰 여백이다.
const SPACING = {
  content: 22,
  actions: 16,
  buttonGap: 8,
  confirmTop: 20,
  textButtonTop: 14,
  textButtonX: 12,
  textButtonY: 6,
} as const;

const TEXT_BUTTON_RADIUS = 8;

export function Alert({
  visible: requested,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
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
            bg="$dimmedBackground"
            items="center"
            justify="center"
            px={SCREEN_PADDING}
            opacity={1}
            transition={TRANSITION}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          >
            <YStack
              width="100%"
              maxW={DIALOG_WIDTH}
              bg="$floatBackground"
              rounded={DIALOG_RADIUS}
              scale={1}
              transition={TRANSITION}
              enterStyle={{ scale: DIALOG_ENTER_SCALE }}
              exitStyle={{ scale: DIALOG_ENTER_SCALE }}
            >
              <Text
                px={SPACING.content}
                pt={SPACING.content}
                fontSize="$6"
                fontWeight="700"
                color="$grey800"
              >
                {message}
              </Text>

              {confirmLabel ? (
                <XStack
                  gap={SPACING.buttonGap}
                  px={SPACING.actions}
                  pt={SPACING.confirmTop}
                  pb={SPACING.actions}
                >
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
                <XStack
                  self="flex-end"
                  mt={SPACING.textButtonTop}
                  mr={SPACING.actions}
                  mb={SPACING.actions}
                  px={SPACING.textButtonX}
                  py={SPACING.textButtonY}
                  rounded={TEXT_BUTTON_RADIUS}
                  pressStyle={{ bg: PRESS_DIM }}
                  accessibilityRole="button"
                  onPress={onClose}
                >
                  <Text fontSize="$4" fontWeight="700" color="$blue500">
                    {t("component.confirm")}
                  </Text>
                </XStack>
              )}
            </YStack>
          </YStack>
        )}
      </AnimatePresence>
    </Modal>
  );
}
