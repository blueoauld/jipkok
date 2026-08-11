import { Image } from "expo-image";
import {
  Bubble,
  type BubbleProps,
  type IMessage,
} from "react-native-gifted-chat";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { formatMessageTime } from "@/lib/date";
import { PHOTO_PRESS_OPACITY } from "@/lib/design";

const PHOTO_SIZE = 200;

const MIN_HEIGHT = 36;

export function displayMinute(createdAt: number | Date) {
  return Math.floor(new Date(createdAt).getTime() / 60_000);
}

const PHOTO_TRANSITION = 200;

export function ChatBubble({
  onPressPhoto,
  ...props
}: BubbleProps<IMessage> & { onPressPhoto: (url: string) => void }) {
  const theme = useTheme();
  const mine = props.position === "right";
  const photoOnly = !!props.currentMessage.image && !props.currentMessage.text;

  const next = props.nextMessage;
  const showTime =
    !next?.createdAt ||
    next.user._id !== props.currentMessage.user._id ||
    displayMinute(next.createdAt) !==
      displayMinute(props.currentMessage.createdAt);

  const time = showTime && (
    <Text shrink={0} fontSize="$1" color="$color11" mb={2}>
      {formatMessageTime(new Date(props.currentMessage.createdAt))}
    </Text>
  );

  return (
    <XStack shrink={1} items="flex-end" gap="$1.5">
      {mine && time}

      <Bubble
        {...props}
        containerStyle={{
          left: { flexShrink: 1 },
          right: { flexShrink: 1 },
        }}
        wrapperStyle={
          photoOnly
            ? {
                left: { backgroundColor: "transparent", borderRadius: 0 },
                right: { backgroundColor: "transparent", borderRadius: 0 },
              }
            : {
                left: {
                  backgroundColor: theme.color1.val,
                  borderWidth: 2,
                  borderColor: theme.color12.val,
                  borderRadius: 0,
                  minHeight: MIN_HEIGHT,
                  justifyContent: "center",
                },
                right: {
                  backgroundColor: theme.blue10.val,
                  borderWidth: 2,
                  borderColor: theme.color12.val,
                  borderRadius: 0,
                  minHeight: MIN_HEIGHT,
                  justifyContent: "center",
                },
              }
        }
        containerToPreviousStyle={{
          left: { borderTopLeftRadius: 0 },
          right: { borderTopRightRadius: 0 },
        }}
        containerToNextStyle={{
          left: { borderBottomLeftRadius: 0 },
          right: { borderBottomRightRadius: 0 },
        }}
        textStyle={{
          left: { color: theme.color12.val },
          right: { color: "white" },
        }}
        bottomContainerStyle={{
          left: { paddingHorizontal: 0, paddingBottom: 0 },
          right: { paddingHorizontal: 0, paddingBottom: 0 },
        }}
        renderMessageImage={({ currentMessage }) =>
          currentMessage.image ? (
            <YStack
              pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
              onPress={() => onPressPhoto(currentMessage.image!)}
            >
              <Image
                source={{
                  uri: currentMessage.image,
                  // 서명 URL은 매번 달라져서 메시지 id를 캐시 키로 쓴다.
                  cacheKey: String(currentMessage._id),
                }}
                contentFit="cover"
                transition={PHOTO_TRANSITION}
                style={{
                  width: PHOTO_SIZE,
                  height: PHOTO_SIZE,
                  borderWidth: 2,
                  borderColor: theme.color12.val,
                }}
              />
            </YStack>
          ) : null
        }
        renderTime={() => null}
      />

      {!mine && time}
    </XStack>
  );
}
