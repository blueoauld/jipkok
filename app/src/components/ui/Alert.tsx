import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "react-native";
import { AnimatePresence, XStack, YStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import {
  DIALOG_BUTTON_GAP,
  DIALOG_BUTTON_PADDING,
  DIALOG_ENTER_SCALE,
  DIALOG_RADIUS,
  DIALOG_TEXT_PADDING,
  DIALOG_WIDTH,
  PRESS_DIM,
  SCREEN_PADDING,
  tapSlop,
  TRANSITION,
} from "@/lib/design";

// TDS 다이얼로그에서 잰 여백이다. 안쪽 여백과 버튼 사이는 design.ts에 있다.
const SPACING = {
  titleGap: 8,
  confirmTop: 20,
  textButtonTop: 14,
  textButtonX: 12,
  textButtonY: 6,
} as const;

const TEXT_BUTTON_RADIUS = 8;

const CONFIRM_LINE_HEIGHT = 26;
const CONFIRM_TAP_SLOP = tapSlop({
  height: CONFIRM_LINE_HEIGHT + SPACING.textButtonY * 2,
});

export function Alert({
  visible: requested,
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
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
              <YStack
                px={DIALOG_TEXT_PADDING}
                pt={DIALOG_TEXT_PADDING}
                gap={SPACING.titleGap}
              >
                <Text preset="title" color="$grey800">
                  {title}
                </Text>
                <Text
                  fontSize="$2"
                  lineHeight="$2"
                  fontWeight="500"
                  color="$grey600"
                >
                  {message}
                </Text>
              </YStack>

              {confirmLabel ? (
                <XStack
                  gap={DIALOG_BUTTON_GAP}
                  px={DIALOG_BUTTON_PADDING}
                  pt={SPACING.confirmTop}
                  pb={DIALOG_BUTTON_PADDING}
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
                  mr={DIALOG_BUTTON_PADDING}
                  mb={DIALOG_BUTTON_PADDING}
                  px={SPACING.textButtonX}
                  py={SPACING.textButtonY}
                  rounded={TEXT_BUTTON_RADIUS}
                  pressStyle={{ bg: PRESS_DIM }}
                  hitSlop={CONFIRM_TAP_SLOP}
                  accessible
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
