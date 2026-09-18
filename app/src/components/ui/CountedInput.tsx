import { type RefObject, useState } from "react";

import { FormField } from "@/components/FormField";
import { Input, type InputProps } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";

export function CountedInput({
  valueRef,
  maxLength,
  defaultValue = "",
  onChangeText,
  ...props
}: Omit<InputProps, "maxLength"> & {
  valueRef: RefObject<string>;
  maxLength: number;
}) {
  const [length, setLength] = useState(String(defaultValue).length);

  return (
    <FormField
      right={
        <Text preset="caption" color="$grey600">
          {`${length} / ${maxLength}`}
        </Text>
      }
    >
      <Input
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
