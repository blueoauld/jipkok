import { Button, Text, XStack } from "tamagui";

export function SegmentedControl<T extends string>({
  values,
  value,
  onChange,
}: {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <XStack bg="$gray4" rounded="$7" p="$1" gap="$1">
      {values.map((item) => {
        const selected = item === value;

        return (
          <Button
            key={item}
            flex={1}
            size="$2"
            rounded="$6"
            borderWidth={0}
            bg={selected ? "$gray1" : "transparent"}
            pressStyle={{ bg: selected ? "$gray1" : "$gray5" }}
            onPress={() => onChange(item)}
          >
            <Text fontWeight={selected ? "600" : "400"} color="$color">
              {item}
            </Text>
          </Button>
        );
      })}
    </XStack>
  );
}
