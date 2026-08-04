import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import dayjs from "dayjs";
import type { ImageStyle } from "react-native";
import {
  Bubble,
  type BubbleProps,
  type IMessage,
} from "react-native-gifted-chat";
import { Text, useTheme, XStack } from "tamagui";

import { ChatImage } from "@/components/ChatImage";
import { alertInfo } from "@/lib/alert";

const TIME_FORMAT = "A h:mm";

const RADIUS = 10;

const TEXT_FONT_SIZE = 15;
const TEXT_LINE_HEIGHT = 19;
const TEXT_MARGIN = { marginVertical: 10, marginHorizontal: 12 };

const IMAGE_SIZE = 200;

const IMAGE_STYLE: ImageStyle = {
  width: IMAGE_SIZE,
  height: IMAGE_SIZE,
  borderRadius: RADIUS,
};

const BOTTOM_STYLE = { paddingHorizontal: 0, paddingBottom: 0 };

const COPIED_MESSAGE = "메시지를 복사했습니다.";

export function ChatBubble(props: BubbleProps<IMessage>) {
  const { imageStyle: _avatarImageStyle, ...bubbleProps } =
    props as BubbleProps<IMessage> & { imageStyle?: unknown };

  const { currentMessage, position } = props;
  const theme = useTheme();

  const isRight = position === "right";
  const time = dayjs(currentMessage.createdAt).locale("ko").format(TIME_FORMAT);

  const isImageOnly = !!currentMessage.image && !currentMessage.text;
  const wrapperColor = (color: string) => (isImageOnly ? "transparent" : color);

  const meta = (
    <Text shrink={0} pb={2} theme="gray" color="$color10" fontSize={11}>
      {time}
    </Text>
  );

  const copyText = async () => {
    if (!currentMessage.text) {
      return;
    }

    await Clipboard.setStringAsync(currentMessage.text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    alertInfo(COPIED_MESSAGE);
  };

  const bubble = (
    <Bubble
      {...bubbleProps}
      onLongPressMessage={copyText}
      renderTime={() => null}
      renderTicks={() => null}
      containerStyle={{ left: { flexShrink: 1 }, right: { flexShrink: 1 } }}
      wrapperStyle={{
        left: {
          backgroundColor: wrapperColor(theme.gray4.val),
          borderRadius: RADIUS,
        },
        right: {
          backgroundColor: wrapperColor(theme.blue10.val),
          borderRadius: RADIUS,
        },
      }}
      renderMessageImage={({ currentMessage: message }) =>
        message.image ? (
          <ChatImage
            uri={message.image}
            style={IMAGE_STYLE}
            uploading={message.pending}
          />
        ) : null
      }
      textStyle={{
        left: {
          color: theme.color.val,
          fontSize: TEXT_FONT_SIZE,
          lineHeight: TEXT_LINE_HEIGHT,
        },
        right: {
          color: "white",
          fontSize: TEXT_FONT_SIZE,
          lineHeight: TEXT_LINE_HEIGHT,
        },
      }}
      messageTextProps={{
        containerStyle: { left: TEXT_MARGIN, right: TEXT_MARGIN },
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
