import { Image } from "expo-image";
import { XIcon } from "phosphor-react-native";
import type { ReplyPreviewProps } from "react-native-gifted-chat/lib/components/ReplyPreview";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { PRESS_OPACITY } from "@/lib/design";

const IMAGE_SIZE = 40;
const CLOSE_ICON_SIZE = 18;
const PHOTO_TEXT = "사진";

export function ChatReplyPreview({
  name,
  replyMessage,
  onClearReply,
}: ReplyPreviewProps & { name: string }) {
  const theme = useTheme();

  return (
    <XStack mx="$3" mt="$3" rounded="$7" overflow="hidden" bg="$gray4">
      <XStack flex={1} items="center" px="$3" py="$2.5" gap="$2.5">
        {replyMessage.image && (
          <Image
            source={replyMessage.image}
            contentFit="cover"
            style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 4 }}
          />
        )}

        <YStack flex={1} gap="$1">
          <Text fontSize="$2" fontWeight="600" color="$color10">
            {name}에게 답장
          </Text>

          <Text fontSize="$3" theme="gray" color="$color10" numberOfLines={1}>
            {replyMessage.text || PHOTO_TEXT}
          </Text>
        </YStack>

        <XStack
          py="$2"
          pressStyle={{ opacity: PRESS_OPACITY }}
          onPress={onClearReply}
        >
          <XIcon size={CLOSE_ICON_SIZE} color={theme.gray10.val} />
        </XStack>
      </XStack>
    </XStack>
  );
}
