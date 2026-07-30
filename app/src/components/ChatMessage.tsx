import type { ComponentType } from "react";
import type { ImageStyle } from "react-native";
import {
  Message,
  type IMessage,
  type LeftRightStyle,
  type MessageProps,
} from "react-native-gifted-chat";

const AVATAR_SIZE = 38;

const MAX_WIDTH = "80%";

const AVATAR_STYLE: ImageStyle = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  borderRadius: AVATAR_SIZE / 2,
};

const MessageWithAvatarStyle = Message as ComponentType<
  MessageProps<IMessage> & { imageStyle?: LeftRightStyle<ImageStyle> }
>;

export function ChatMessage(props: MessageProps<IMessage>) {
  return (
    <MessageWithAvatarStyle
      {...props}
      containerStyle={{
        left: { maxWidth: MAX_WIDTH },
        right: { maxWidth: MAX_WIDTH },
      }}
      imageStyle={{ left: AVATAR_STYLE, right: AVATAR_STYLE }}
    />
  );
}
