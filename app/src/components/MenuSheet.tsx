import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTokens, Sheet, Text, useTheme, XStack } from "tamagui";

import { OVERLAY_BG, RETRO_BORDER_WIDTH } from "@/lib/design";

export type MenuSheetItem = {
  label: string;
  destructive?: boolean;
  selected?: boolean;
  onPress?: () => void;
};

export function MenuSheet({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MenuSheetItem[];
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode="fit"
      dismissOnSnapToBottom
    >
      <Sheet.Overlay bg={OVERLAY_BG} />

      <Sheet.Frame
        bg="$color1"
        rounded={0}
        borderTopWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        p="$4"
        pb={getTokens().space.$6.val + insets.bottom}
        gap="$2"
      >
        {items.map(({ label, destructive, selected, onPress }) => (
          <XStack
            key={label}
            items="center"
            justify="space-between"
            gap="$2"
            p="$3"
            rounded={0}
            pressStyle={{ bg: "$color3" }}
            onPress={() => {
              onOpenChange(false);
              onPress?.();
            }}
          >
            <Text
              flex={1}
              numberOfLines={1}
              fontSize="$4"
              color={destructive ? "$red10" : "$color"}
            >
              {label}
            </Text>

            <XStack opacity={selected ? 1 : 0}>
              <CheckIcon size={20} weight="bold" color={theme.color.val} />
            </XStack>
          </XStack>
        ))}
      </Sheet.Frame>
    </Sheet>
  );
}
