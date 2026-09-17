import { XIcon } from "phosphor-react-native/src/icons/X";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Text, useTheme, XStack, YStack } from "tamagui";

import {
  INPUT_BAR_PADDING_X,
  INPUT_BAR_PADDING_Y,
  INPUT_RADIUS,
  PRESS_OPACITY,
  tapSlop,
} from "@/lib/design";

const CANCEL_ICON_SIZE = 18;
const CANCEL_BUTTON_SIZE = 32;
const CANCEL_TAP_SLOP = tapSlop({
  width: CANCEL_BUTTON_SIZE,
  height: CANCEL_BUTTON_SIZE,
});
const TEXT_GAP = 2;

// 입력줄 위에 뜨는 답장 대상 상자다.
export function ReplyPreviewBox({
  title,
  summary,
  thumbnail,
  onCancel,
}: {
  title: string;
  summary: string;
  thumbnail?: ReactNode;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <XStack
      mx={INPUT_BAR_PADDING_X}
      mt={INPUT_BAR_PADDING_Y}
      pl="$3.5"
      pr="$1.5"
      py="$2.5"
      gap="$2.5"
      rounded={INPUT_RADIUS}
      bg="$grey100"
      items="center"
    >
      {thumbnail}

      <YStack flex={1} gap={TEXT_GAP}>
        <Text fontSize="$1" fontWeight="600" color="$grey800">
          {title}
        </Text>

        <Text fontSize="$1" color="$grey600" numberOfLines={1}>
          {summary}
        </Text>
      </YStack>

      <XStack
        p="$2"
        pressStyle={{ opacity: PRESS_OPACITY }}
        hitSlop={CANCEL_TAP_SLOP}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t("a11y.cancelReply")}
        onPress={onCancel}
      >
        <XIcon size={CANCEL_ICON_SIZE} color={theme.grey500.val} />
      </XStack>
    </XStack>
  );
}
