import { forwardRef } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { useTheme, XStack } from "tamagui";

import { FLOATING_BUTTON_SIZE } from "@/lib/design";

const FONT_SIZE = 16;
const LINE_HEIGHT = 22;
const MAX_LINES = 7;
const PADDING_X = 16;
// 한 줄일 때 입력칸이 옆의 둥근 버튼과 같은 높이여야 나란히 선다. 버튼 크기가 바뀌면 따라간다.
const PADDING_Y = (FLOATING_BUTTON_SIZE - LINE_HEIGHT) / 2;

// 입력줄의 회색 알약 입력칸이다. 여러 줄이면 일곱 줄까지 늘어난다.
export const PillInput = forwardRef<TextInput, TextInputProps>(
  function PillInput({ multiline, style, ...props }, ref) {
    const theme = useTheme();

    return (
      <XStack flex={1} rounded={FLOATING_BUTTON_SIZE / 2} bg="$grey100">
        <TextInput
          ref={ref}
          placeholderTextColor={theme.grey500.val}
          multiline={multiline}
          {...props}
          style={[
            styles.input,
            multiline ? styles.multiline : styles.singleLine,
            { color: theme.grey900.val },
            style,
          ]}
        />
      </XStack>
    );
  },
);

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: FONT_SIZE,
    paddingHorizontal: PADDING_X,
  },
  multiline: {
    lineHeight: LINE_HEIGHT,
    paddingTop: PADDING_Y,
    paddingBottom: PADDING_Y,
    maxHeight: LINE_HEIGHT * MAX_LINES + PADDING_Y * 2,
  },
  // 한 줄 입력칸은 줄높이와 위아래 여백으로 높이를 잡으면 글자를 넣을 때 높이가 달라진다.
  // 높이를 버튼과 같게 고정하고 글자를 가운데 둔다.
  singleLine: {
    height: FLOATING_BUTTON_SIZE,
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
});
