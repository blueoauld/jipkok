import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import type { MessageReplyProps } from "react-native-gifted-chat/lib/components/MessageReply";
import { Text, useTheme, XStack, YStack } from "tamagui";

const IMAGE_SIZE = 40;

export function ChatMessageReply({
  name,
  replyMessage,
  position,
}: MessageReplyProps & { name: string }) {
  const theme = useTheme();
  const isRight = position === "right";

  const nameColor = isRight ? "white" : theme.color.val;
  const textColor = isRight ? "rgba(255, 255, 255, 0.7)" : theme.color8.val;
  const dividerColor = isRight ? "rgba(255, 255, 255, 0.35)" : theme.color6.val;

  return (
    <YStack self="stretch" px={12} pt={10} gap="$1">
      <Text
        fontSize="$3"
        fontWeight="500"
        style={{ color: nameColor }}
        numberOfLines={1}
      >
        {name}에게 답장
      </Text>

      {!!replyMessage.text && (
        <Text fontSize="$3" style={{ color: textColor }} numberOfLines={2}>
          {replyMessage.text}
        </Text>
      )}

      {replyMessage.image && (
        <XStack mt="$1">
          <Image
            source={replyMessage.image}
            contentFit="cover"
            style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 4 }}
          />
        </XStack>
      )}

      <YStack
        height={StyleSheet.hairlineWidth}
        mt={8}
        style={{ backgroundColor: dividerColor }}
      />
    </YStack>
  );
}
