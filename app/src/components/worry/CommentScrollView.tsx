import { forwardRef } from "react";
import type { ScrollViewProps } from "react-native";
import {
  KeyboardChatScrollView,
  type KeyboardChatScrollViewRef,
} from "react-native-keyboard-controller";

export const CommentScrollView = forwardRef<
  KeyboardChatScrollViewRef,
  ScrollViewProps & { offset: number }
>(({ offset, ...props }, ref) => (
  <KeyboardChatScrollView
    ref={ref}
    automaticallyAdjustContentInsets={false}
    contentInsetAdjustmentBehavior="never"
    {...props}
    offset={offset}
    keyboardLiftBehavior="whenAtEnd"
  />
));

CommentScrollView.displayName = "CommentScrollView";
