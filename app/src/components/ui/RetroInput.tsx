import { XIcon } from "phosphor-react-native/src/icons/X";
import { type Ref, useRef, useState } from "react";
import type { TextInput } from "react-native";
import {
  Input,
  type InputProps,
  type TamaguiElement,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { PRESS_OPACITY, RETRO_BORDER_WIDTH } from "@/lib/design";

const SINGLE_LINE_FIX = {
  py: 0,
  textAlignVertical: "center",
  includeFontPadding: false,
} as const;

const CLEAR_BUTTON_SIZE = 36;
const CLEAR_ICON_SIZE = 18;

export type RetroInputProps = InputProps & { clearable?: boolean };

export function RetroInput({
  theme = "gray",
  multiline,
  clearable,
  value,
  defaultValue,
  onChangeText,
  ...inputProps
}: RetroInputProps) {
  const themeValues = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [typed, setTyped] = useState(Boolean(defaultValue));

  const hasText = value === undefined ? typed : String(value).length > 0;
  const showClear = Boolean(clearable) && !multiline && hasText;

  const changeText = (text: string) => {
    setTyped(text.length > 0);
    onChangeText?.(text);
  };

  return (
    <YStack theme={theme}>
      <RetroShadow color="$gray8" />
      <Input
        ref={inputRef as unknown as Ref<TamaguiElement>}
        size="$4"
        bg="$color1"
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        rounded={0}
        focusStyle={{ borderColor: "$gray12" }}
        color="$color12"
        placeholderTextColor="$color11"
        px="$3"
        pr={showClear ? CLEAR_BUTTON_SIZE : "$3"}
        value={value}
        defaultValue={defaultValue}
        onChangeText={changeText}
        multiline={multiline}
        {...(multiline ? undefined : SINGLE_LINE_FIX)}
        {...inputProps}
      />

      {showClear && (
        <XStack
          position="absolute"
          t={RETRO_BORDER_WIDTH}
          b={RETRO_BORDER_WIDTH}
          r={RETRO_BORDER_WIDTH}
          width={CLEAR_BUTTON_SIZE}
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
            color={themeValues.color11.val}
          />
        </XStack>
      )}
    </YStack>
  );
}
