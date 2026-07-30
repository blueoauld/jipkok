import dayjs from "dayjs";
import {
  Bubble,
  type BubbleProps,
  type IMessage,
} from "react-native-gifted-chat";
import { Text, useTheme, XStack } from "tamagui";

const TIME_FORMAT = "A h:mm";

// 프로필 화면의 본문 박스($5)와 같은 값.
const RADIUS = 10;

const TEXT_LINE_HEIGHT = 22;

const BOTTOM_STYLE = { paddingHorizontal: 0, paddingBottom: 0 };

export function ChatBubble(props: BubbleProps<IMessage>) {
  const { imageStyle: _avatarImageStyle, ...bubbleProps } =
    props as BubbleProps<IMessage> & { imageStyle?: unknown };

  const { currentMessage, position } = props;
  const theme = useTheme();

  const isRight = position === "right";
  const time = dayjs(currentMessage.createdAt).locale("ko").format(TIME_FORMAT);

  const meta = (
    <Text shrink={0} pb={2} theme="gray" color="$color10" fontSize={11}>
      {time}
    </Text>
  );

  const bubble = (
    <Bubble
      {...bubbleProps}
      renderTime={() => null}
      renderTicks={() => null}
      containerStyle={{ left: { flexShrink: 1 }, right: { flexShrink: 1 } }}
      wrapperStyle={{
        left: { backgroundColor: theme.gray4.val, borderRadius: RADIUS },
        right: { backgroundColor: theme.blue10.val, borderRadius: RADIUS },
      }}
      textStyle={{
        left: { color: theme.color.val, lineHeight: TEXT_LINE_HEIGHT },
        right: { color: "white", lineHeight: TEXT_LINE_HEIGHT },
      }}
      messageTextProps={{
        containerStyle: {
          left: { marginVertical: 8, marginHorizontal: 12 },
          right: { marginVertical: 8, marginHorizontal: 12 },
        },
      }}
      bottomContainerStyle={{ left: BOTTOM_STYLE, right: BOTTOM_STYLE }}
      containerToNextStyle={{
        left: { borderBottomLeftRadius: RADIUS },
        right: { borderBottomRightRadius: RADIUS },
      }}
      containerToPreviousStyle={{
        left: { borderTopLeftRadius: RADIUS },
        right: { borderTopRightRadius: RADIUS },
      }}
    />
  );

  return (
    <XStack shrink={1} items="flex-end" gap={4}>
      {isRight ? meta : bubble}
      {isRight ? bubble : meta}
    </XStack>
  );
}
