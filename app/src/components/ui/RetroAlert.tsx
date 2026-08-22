import { useTranslation } from "react-i18next";
import { Modal, Platform, Text as NativeText } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { RetroShadow } from "@/components/ui/RetroShadow";
import { OVERLAY_BG, RETRO_BORDER_WIDTH } from "@/lib/design";

const MONO_FONT = Platform.select({ ios: "Menlo", default: "monospace" });

const VARIANTS = {
  error: { label: "ERROR.EXE", barColor: "$red10", labelColor: "white" },
  info: { label: "INFO.EXE", barColor: "$blue10", labelColor: "white" },
  warning: { label: "WARNING.EXE", barColor: "$yellow10", labelColor: "black" },
} as const;

export type RetroAlertVariant = keyof typeof VARIANTS;

export function RetroAlert({
  visible,
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
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <YStack flex={1} bg={OVERLAY_BG} justify="center" p="$4">
        <YStack>
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
                  color: VARIANTS[variant].labelColor,
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
                <Text color="$color12" fontSize="$3">
                  {message}
                </Text>
              </YStack>

              <YStack mx="$4" borderWidth={1} borderColor="$color8" />

              {confirmLabel ? (
                <XStack p="$4" gap="$3">
                  <RetroButton flex={1} theme="gray" onPress={onClose}>
                    {t("component.close")}
                  </RetroButton>

                  <RetroButton
                    flex={1}
                    theme={destructive ? "red" : undefined}
                    onPress={() => {
                      onClose();
                      onConfirm?.();
                    }}
                  >
                    {confirmLabel}
                  </RetroButton>
                </XStack>
              ) : (
                <XStack justify="flex-end" p="$4">
                  <RetroButton onPress={onClose}>
                    {t("component.confirm")}
                  </RetroButton>
                </XStack>
              )}
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
