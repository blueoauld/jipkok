import { Input, type InputProps } from "tamagui";

export function FormInput(props: InputProps) {
  return (
    <Input
      size="$4"
      bg="$gray4"
      rounded="$7"
      borderWidth={0}
      {...props}
    />
  );
}
