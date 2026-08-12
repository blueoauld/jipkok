import { forwardRef } from "react";
import type { ScrollViewProps } from "react-native";
import {
  KeyboardChatScrollView,
  type KeyboardChatScrollViewRef,
} from "react-native-keyboard-controller";

export const ChatScrollView = forwardRef<
  KeyboardChatScrollViewRef,
  ScrollViewProps
>((props, ref) => (
  <KeyboardChatScrollView
    ref={ref}
    inverted
    automaticallyAdjustContentInsets={false}
    contentInsetAdjustmentBehavior="never"
    {...props}
  />
));

ChatScrollView.displayName = "ChatScrollView";
