import { type RefObject, useState } from "react";
import { Text } from "tamagui";

import { FormField } from "@/components/FormField";
import { RetroInput, type RetroInputProps } from "@/components/ui/RetroInput";

export function CountedInput({
  valueRef,
  maxLength,
  defaultValue = "",
  onChangeText,
  ...props
}: Omit<RetroInputProps, "maxLength"> & {
  valueRef: RefObject<string>;
  maxLength: number;
}) {
  const [length, setLength] = useState(String(defaultValue).length);

  return (
    <FormField
      right={
        <Text theme="gray" color="$color11">
          {`${length} / ${maxLength}`}
        </Text>
      }
    >
      <RetroInput
        {...props}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChangeText={(text) => {
          valueRef.current = text;
          setLength(text.length);
          onChangeText?.(text);
        }}
      />
    </FormField>
  );
}
