import { Sheet, Text, XStack } from "tamagui";

export type MenuSheetItem = {
  label: string;
  destructive?: boolean;
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
        {items.map(({ label, destructive, onPress }) => (
          <XStack
            key={label}
            items="center"
            p="$3"
            rounded="$5"
            pressStyle={{ bg: "$color4" }}
            onPress={() => {
              onOpenChange(false);
              onPress?.();
            }}
          >
            <Text fontSize="$4" color={destructive ? "$red10" : "$color"}>
              {label}
            </Text>
          </XStack>
        ))}
      </Sheet.Frame>
    </Sheet>
  );
}
