import { Button, type ButtonProps } from "tamagui";

export function FormButton(props: ButtonProps) {
  return <Button size="$4" bg="$gray4" rounded="$7" {...props} />;
}
