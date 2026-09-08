import { XIcon } from "phosphor-react-native/src/icons/X";
import { useTranslation } from "react-i18next";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import type { WorryCommentResponse } from "@/lib/api";
import {
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";
import { useThemeBackground } from "@/lib/theme/accent";
import { commentLabel } from "@/lib/worry";

const CANCEL_ICON_SIZE = 18;
const REPLY_PREVIEW_GAP = 2;

export function WorryReplyPreview({
  replyTo,
  onCancel,
}: {
  replyTo: WorryCommentResponse;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const background = useThemeBackground();

  return (
    <YStack px="$4" pt="$3" bg={background}>
      {/* 그림자가 아래로 넘치므로 그만큼 띄워야 입력줄에 안 가린다. */}
      <YStack theme="gray" mb={RETRO_SHADOW_OFFSET}>
        <RetroShadow color="$gray8" />
        <XStack
          borderWidth={RETRO_BORDER_WIDTH}
          borderColor="$gray12"
          bg="$color1"
          items="center"
          pl="$3"
          pr="$2"
          py="$2"
          gap="$2.5"
        >
          <YStack flex={1} gap={REPLY_PREVIEW_GAP}>
            <Text fontSize="$2" fontWeight="600" color="$color12">
              {t("worry.detail.replyTo", {
                name: commentLabel(replyTo),
              })}
            </Text>
            <Text fontSize="$2" color="$color11" numberOfLines={1}>
              {replyTo.content}
            </Text>
          </YStack>

          <XStack
            p="$2"
            pressStyle={{ opacity: PRESS_OPACITY }}
            onPress={onCancel}
          >
            <XIcon size={CANCEL_ICON_SIZE} color={theme.color12.val} />
          </XStack>
        </XStack>
      </YStack>
    </YStack>
  );
}
