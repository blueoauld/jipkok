import { Input, type InputProps } from "tamagui";

export function FormInput(props: InputProps) {
  return (
    <Input
      size="$4"
      theme="gray"
      bg="$color4"
      rounded="$7"
      borderWidth={0}
      {...props}
    />
  );
}
