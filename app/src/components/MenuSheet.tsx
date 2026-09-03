import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { useEffect } from "react";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTokens, Sheet, Text, useTheme, XStack } from "tamagui";

import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import { OVERLAY_BG, RETRO_BORDER_WIDTH, TRANSITION } from "@/lib/design";

export type MenuSheetItem = {
  label: string;
  destructive?: boolean;
  selected?: boolean;
  onPress?: () => void;
};

export function MenuSheet({
  open: requested,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MenuSheetItem[];
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const open = useVisibleWhenUnlocked(requested);

  // 키보드가 올라와 있으면 시트를 덮는다. 둘은 같이 떠 있을 수 없다.
  useEffect(() => {
    if (open) {
      Keyboard.dismiss();
    }
  }, [open]);

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      transition={TRANSITION}
    >
      <Sheet.Overlay
        bg={OVERLAY_BG}
        transition={TRANSITION}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />

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
