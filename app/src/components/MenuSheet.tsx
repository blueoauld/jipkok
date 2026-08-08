import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTokens, Sheet, Text, useTheme, XStack } from "tamagui";

import { SHEET_OVERLAY_OPACITY } from "@/lib/design";

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
      <Sheet.Overlay opacity={SHEET_OVERLAY_OPACITY} />
      <Sheet.Handle bg="$color3" />

      <Sheet.Frame
        bg="$color3"
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
            rounded="$5"
            pressStyle={{ bg: "$color4" }}
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
