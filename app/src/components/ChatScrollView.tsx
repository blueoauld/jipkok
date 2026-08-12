import { forwardRef } from "react";
import type { ScrollViewProps } from "react-native";
import {
  KeyboardChatScrollView,
  type KeyboardChatScrollViewRef,
} from "react-native-keyboard-controller";

export const ChatScrollView = forwardRef<
  KeyboardChatScrollViewRef,
  ScrollViewProps & {
    offset: number;
    onInsetChange: (top: number) => void;
  }
>(({ offset, onInsetChange, ...props }, ref) => (
  <KeyboardChatScrollView
    ref={ref}
    automaticallyAdjustContentInsets={false}
    contentInsetAdjustmentBehavior="never"
    {...props}
    inverted
    offset={offset}
    onContentInsetChange={(insets) => onInsetChange(insets.top)}
  />
));

ChatScrollView.displayName = "ChatScrollView";
