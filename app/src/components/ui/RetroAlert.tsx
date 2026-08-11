import { useState } from "react";
import { Modal, Platform, Text as NativeText } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { OVERLAY_BG } from "@/lib/design";

const SHADOW_OFFSET = 4;

const MONO_FONT = Platform.select({ ios: "Menlo", default: "monospace" });

const VARIANTS = {
  error: { label: "ERROR.EXE", barColor: "$red9", labelColor: "white" },
  info: { label: "INFO.EXE", barColor: "$blue9", labelColor: "white" },
  warning: { label: "WARNING.EXE", barColor: "$yellow9", labelColor: "black" },
} as const;

export type RetroAlertVariant = keyof typeof VARIANTS;

export function RetroAlert({
  visible,
  variant = "error",
  title,
  message,
  onClose,
}: {
  visible: boolean;
  variant?: RetroAlertVariant;
  title: string;
  message: string;
  onClose: () => void;
}) {
  const [content, setContent] = useState({ variant, title, message });

  if (
    visible &&
    (content.variant !== variant ||
      content.title !== title ||
      content.message !== message)
  ) {
    setContent({ variant, title, message });
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <YStack flex={1} bg={OVERLAY_BG} justify="center" p="$4">
        <YStack>
          <YStack
            position="absolute"
            t={SHADOW_OFFSET}
            b={-SHADOW_OFFSET}
            l={SHADOW_OFFSET}
            r={-SHADOW_OFFSET}
            bg="$color8"
          />

          <YStack borderWidth={2} borderColor="$color12" bg="$color1">
            <XStack
              bg={VARIANTS[content.variant].barColor}
              px="$3"
              py="$2.5"
              items="center"
              borderBottomWidth={2}
              borderColor="$color12"
            >
              <NativeText
                style={{
                  flex: 1,
                  fontFamily: MONO_FONT,
                  fontWeight: "700",
                  fontSize: 18,
                  color: VARIANTS[content.variant].labelColor,
                }}
              >
                {VARIANTS[content.variant].label}
              </NativeText>
            </XStack>

            <YStack p="$4" gap="$2">
              <Text fontSize="$6" fontWeight="700" color="$color12">
                {content.title}
              </Text>
              <Text color="$color12" fontSize="$3">
                {content.message}
              </Text>
            </YStack>

            <YStack mx="$4" borderWidth={1} borderColor="$color8" />

            <XStack justify="flex-end" p="$4">
              <RetroButton onPress={onClose}>확인</RetroButton>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
