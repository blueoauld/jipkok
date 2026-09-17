import { XIcon } from "phosphor-react-native/src/icons/X";
import { type Ref, useRef, useState } from "react";
import type { TextInput } from "react-native";
import {
  Input as TamaguiInput,
  type InputProps as TamaguiInputProps,
  type TamaguiElement,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

import { INPUT_HEIGHT, INPUT_RADIUS, PRESS_OPACITY } from "@/lib/design";

// TDS 텍스트 필드에서 잰 안쪽 여백이다.
const PADDING_X = 16;
const PADDING_Y = 14;

// 여러 줄은 Tamagui가 rows로 높이를 잡으므로 한 줄일 때만 높이를 고정한다.
const SINGLE_LINE_STYLE = {
  height: INPUT_HEIGHT,
  py: 0,
  textAlignVertical: "center",
  includeFontPadding: false,
} as const;

// 아이콘이 오른쪽 안쪽 여백에 맞게 놓이는 폭이다.
const CLEAR_BUTTON_WIDTH = 48;
const CLEAR_ICON_SIZE = 18;

export type InputProps = TamaguiInputProps & {
  clearable?: boolean;
};

export function Input({
  multiline,
  clearable,
  value,
  defaultValue,
  onChangeText,
  ...inputProps
}: InputProps) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [typed, setTyped] = useState(Boolean(defaultValue));

  const hasText = value === undefined ? typed : String(value).length > 0;
  const showClear = Boolean(clearable) && !multiline && hasText;

  const changeText = (text: string) => {
    setTyped(text.length > 0);
    onChangeText?.(text);
  };

  return (
    <YStack>
      <TamaguiInput
        ref={inputRef as unknown as Ref<TamaguiElement>}
        size="$4"
        rounded={INPUT_RADIUS}
        bg="$greyOpacity50"
        borderWidth={1}
        borderColor="$greyOpacity100"
        focusStyle={{ borderColor: "$greyOpacity100" }}
        color="$grey800"
        placeholderTextColor="$grey500"
        px={PADDING_X}
        py={PADDING_Y}
        pr={showClear ? CLEAR_BUTTON_WIDTH : PADDING_X}
        value={value}
        defaultValue={defaultValue}
        onChangeText={changeText}
        multiline={multiline}
        {...(multiline ? undefined : SINGLE_LINE_STYLE)}
        {...inputProps}
      />

      {showClear && (
        <XStack
          position="absolute"
          t={0}
          b={0}
          r={0}
          width={CLEAR_BUTTON_WIDTH}
          items="center"
          justify="center"
          pressStyle={{ opacity: PRESS_OPACITY }}
          onPress={() => {
            inputRef.current?.clear();
            changeText("");
          }}
        >
          <XIcon
            size={CLEAR_ICON_SIZE}
            weight="bold"
            color={theme.grey500.val}
          />
        </XStack>
      )}
    </YStack>
  );
}
