import { CheckIcon } from "phosphor-react-native";
import { Sheet, Text, useTheme, XStack } from "tamagui";

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

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode="fit"
      dismissOnSnapToBottom
    >
      <Sheet.Overlay opacity={0.6} />
      <Sheet.Handle bg="$color3" />

      <Sheet.Frame bg="$color3" p="$4" pb="$6" gap="$2">
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
