import { type RefObject, useState } from "react";
import { Text } from "tamagui";

import { FormField } from "@/components/FormField";
import { RetroInput, type RetroInputProps } from "@/components/ui/RetroInput";

// 글자 수를 오른쪽 아래에 보여주는 입력. 값은 ref에만 쓰고 리렌더는 글자 수만 일으킨다.
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
