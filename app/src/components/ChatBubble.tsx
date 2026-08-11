import {
  Bubble,
  type BubbleProps,
  type IMessage,
} from "react-native-gifted-chat";
import { Text, useTheme, XStack } from "tamagui";

import { formatMessageTime } from "@/lib/date";

export function ChatBubble(props: BubbleProps<IMessage>) {
  const theme = useTheme();
  const mine = props.position === "right";

  const time = (
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
        wrapperStyle={{
          left: {
            backgroundColor: theme.color1.val,
            borderWidth: 2,
            borderColor: theme.color12.val,
            borderRadius: 0,
          },
          right: {
            backgroundColor: theme.blue10.val,
            borderWidth: 2,
            borderColor: theme.color12.val,
            borderRadius: 0,
          },
        }}
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
        renderTime={() => null}
      />

      {!mine && time}
    </XStack>
  );
}
