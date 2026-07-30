import { Button, type ButtonProps } from "tamagui";

export function FormButton(props: ButtonProps) {
  return <Button size="$4" theme="gray" bg="$color4" rounded="$7" {...props} />;
}
