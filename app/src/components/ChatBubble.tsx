import { Image } from "expo-image";
import type {
  BubbleProps,
  IMessage,
  ReplyMessage,
} from "react-native-gifted-chat";
import { Text, XStack, YStack } from "tamagui";

import { formatMessageTime } from "@/lib/date";
import { PHOTO_PRESS_OPACITY, PRESS_OPACITY } from "@/lib/design";

const PHOTO_SIZE = 200;
const PHOTO_TRANSITION = 200;

const QUOTE_PHOTO_SIZE = 40;
const QUOTE_TEXT = "사진";

export const CHAT_BUBBLE_MIN_HEIGHT = 41;

export function ChatBubble({
  currentMessage,
  position,
  onPressPhoto,
  onPressReply,
  partnerId,
  partnerName,
}: BubbleProps<IMessage> & {
  onPressPhoto: (url: string) => void;
  onPressReply: (reply: ReplyMessage) => void;
  partnerId: number;
  partnerName: string;
}) {
  const mine = position === "right";
  const photo = currentMessage.image;
  const reply = currentMessage.replyMessage;
  const blueBg = mine && !photo;

  const time = (
    <Text shrink={0} fontSize="$1" color="$color11" mb={2}>
      {formatMessageTime(new Date(currentMessage.createdAt))}
    </Text>
  );

  return (
    <XStack items="flex-end" gap="$1.5">
      {mine && time}

      <YStack
        shrink={1}
        minH={CHAT_BUBBLE_MIN_HEIGHT}
        justify="center"
        borderWidth={2}
        borderColor="$color12"
        rounded={0}
        overflow="hidden"
        bg={blueBg ? "$blue10" : "$color1"}
      >
        {reply && (
          <YStack
            px="$3"
            pt="$2"
            gap="$1"
            pressStyle={{ opacity: PRESS_OPACITY }}
            onPress={() => onPressReply(reply)}
          >
            <Text
              fontSize="$2"
              fontWeight="600"
              color={blueBg ? "white" : "$color12"}
              numberOfLines={1}
            >
              {reply.user._id === partnerId ? partnerName : "나"}에게 답장
            </Text>

            {reply.image ? (
              <XStack>
                <Image
                  source={reply.image}
                  contentFit="cover"
                  style={{ width: QUOTE_PHOTO_SIZE, height: QUOTE_PHOTO_SIZE }}
                />
              </XStack>
            ) : (
              <Text
                fontSize="$2"
                color={blueBg ? "rgba(255, 255, 255, 0.7)" : "$color11"}
                numberOfLines={2}
              >
                {reply.text || QUOTE_TEXT}
              </Text>
            )}

            <YStack
              height={1}
              mt="$1"
              bg={blueBg ? "rgba(255, 255, 255, 0.35)" : "$color8"}
            />
          </YStack>
        )}

        {photo ? (
          <YStack
            pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
            onPress={() => onPressPhoto(photo)}
          >
            <Image
              source={photo}
              contentFit="cover"
              transition={PHOTO_TRANSITION}
              style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
            />
          </YStack>
        ) : (
          <Text
            px="$3"
            py="$2"
            fontSize="$4"
            color={mine ? "white" : "$color12"}
          >
            {currentMessage.text}
          </Text>
        )}
      </YStack>

      {!mine && time}
    </XStack>
  );
}
