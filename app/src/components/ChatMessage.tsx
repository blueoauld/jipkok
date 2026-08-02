import type { ComponentType } from "react";
import type { ImageStyle } from "react-native";
import {
  Message,
  type IMessage,
  type LeftRightStyle,
  type MessageProps,
} from "react-native-gifted-chat";

import { UserAvatar } from "@/components/UserAvatar";

const AVATAR_SIZE = 38;

const MAX_WIDTH = "80%";

const SIDE_MARGIN = 12;

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
        left: { maxWidth: MAX_WIDTH, marginLeft: SIDE_MARGIN },
        right: { maxWidth: MAX_WIDTH, marginRight: SIDE_MARGIN },
      }}
      imageStyle={{ left: AVATAR_STYLE, right: AVATAR_STYLE }}
      renderAvatar={({ currentMessage }) => (
        <UserAvatar
          id={String(currentMessage.user._id)}
          url={
            typeof currentMessage.user.avatar === "string"
              ? currentMessage.user.avatar
              : undefined
          }
          size={AVATAR_SIZE}
          circular
        />
      )}
    />
  );
}
