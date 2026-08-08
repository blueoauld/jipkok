import { CaretDownIcon } from "phosphor-react-native/src/icons/CaretDown";
import { StyleSheet } from "react-native";
import { useTheme, XStack } from "tamagui";

import { GlassSurface } from "./GlassSurface";

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

  return (
    <GlassSurface
      style={{
        borderRadius: 9999,
        overflow: "hidden",
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
    </GlassSurface>
  );
}
