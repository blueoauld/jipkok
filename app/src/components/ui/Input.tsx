import { type Ref, useRef, useState } from "react";
import type { TextInput } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  Input as TamaguiInput,
  type InputProps as TamaguiInputProps,
  type TamaguiElement,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

import {
  INPUT_HEIGHT,
  INPUT_RADIUS,
  PRESS_OPACITY,
  TRANSITION,
} from "@/lib/design";
import i18n from "@/lib/i18n";

// TDS 텍스트 필드에서 잰 안쪽 여백이다.
const PADDING_X = 16;
const PADDING_Y = 14;

// 여러 줄은 Tamagui가 rows로 높이를 잡으므로 한 줄일 때만 높이를 정한다.
const SINGLE_LINE_STYLE = {
  minH: INPUT_HEIGHT,
  py: 0,
  textAlignVertical: "center",
  includeFontPadding: false,
} as const;

// TDS 텍스트 필드의 지우기 아이콘을 옮겼다. 회색 원에서 X를 뚫어 낸 모양이다.
const CLEAR_ICON_SIZE = 20;
const CLEAR_ICON_PATH =
  "m16.207 14.793a.999.999 0 1 1 -1.414 1.414l-2.793-2.793-2.793 2.793a.997.997 0 0 1 -1.414 0 .999.999 0 0 1 0-1.414l2.793-2.793-2.793-2.793a.999.999 0 1 1 1.414-1.414l2.793 2.793 2.793-2.793a.999.999 0 1 1 1.414 1.414l-2.793 2.793zm-4.207-13.793c-6.075 0-11 4.925-11 11s4.925 11 11 11 11-4.925 11-11-4.925-11-11-11z";

// 아이콘 양옆에 안쪽 여백만큼 누를 자리를 둔다. 아이콘 오른쪽 끝이 상자 여백 16에 맞는다.
const CLEAR_BUTTON_WIDTH = CLEAR_ICON_SIZE + PADDING_X * 2;

// TDS는 테두리를 그대로 두고 상자 안에 옅은 막을 덮어 포커스와 오류를 보인다.
const STATE_TINT_OPACITY = 0.05;

export type InputProps = TamaguiInputProps & {
  clearable?: boolean;
  error?: boolean;
};

export function Input({
  multiline,
  clearable,
  error = false,
  value,
  defaultValue,
  onChangeText,
  onFocus,
  onBlur,
  ...inputProps
}: InputProps) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [typed, setTyped] = useState(Boolean(defaultValue));
  const [focused, setFocused] = useState(false);

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
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        multiline={multiline}
        {...(multiline ? undefined : SINGLE_LINE_STYLE)}
        {...inputProps}
      />

      <YStack
        fullscreen
        rounded={INPUT_RADIUS}
        bg={error ? "$red900" : "$blue900"}
        opacity={error || focused ? STATE_TINT_OPACITY : 0}
        transition={TRANSITION}
        pointerEvents="none"
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
          accessible
          accessibilityRole="button"
          accessibilityLabel={i18n.t("a11y.clearText")}
          onPress={() => {
            inputRef.current?.clear();
            changeText("");
          }}
        >
          <Svg
            width={CLEAR_ICON_SIZE}
            height={CLEAR_ICON_SIZE}
            viewBox="0 0 24 24"
          >
            <Path
              d={CLEAR_ICON_PATH}
              fill={theme.grey400.val}
              fillRule="evenodd"
            />
          </Svg>
        </XStack>
      )}
    </YStack>
  );
}
