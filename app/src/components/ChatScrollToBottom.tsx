import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { CaretDownIcon } from "phosphor-react-native";
import { StyleSheet } from "react-native";
import { useTheme, XStack } from "tamagui";

const BUTTON_SIZE = 40;
const ICON_SIZE = 20;

export const CHAT_SCROLL_TO_BOTTOM_CONTENT_STYLE = {
  backgroundColor: "transparent",
  shadowOpacity: 0,
  elevation: 0,
};

export const CHAT_SCROLL_TO_BOTTOM_STYLE = { right: 12, bottom: 16 };

export function ChatScrollToBottom() {
  const theme = useTheme();
  const hasGlass = isLiquidGlassAvailable();

  return (
    <GlassView
      glassEffectStyle="regular"
      style={{
        borderRadius: 9999,
        overflow: "hidden",
        backgroundColor: hasGlass ? undefined : theme.gray4.val,
      }}
    >
      <XStack
        width={BUTTON_SIZE}
        height={BUTTON_SIZE}
        rounded={9999}
        borderWidth={StyleSheet.hairlineWidth}
        borderColor="$borderColor"
        items="center"
        justify="center"
      >
        <CaretDownIcon
          size={ICON_SIZE}
          weight="bold"
          color={theme.color10.val}
        />
      </XStack>
    </GlassView>
  );
}
