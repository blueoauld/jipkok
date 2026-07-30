import { AlertDialog, Button, XStack } from "tamagui";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm?: () => void;
}) {
  return (
    <AlertDialog modal open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay opacity={0.6} />

        <AlertDialog.Content width="85%" maxW={400} p="$4" gap="$3">
          <AlertDialog.Title fontSize="$6">{title}</AlertDialog.Title>

          <AlertDialog.Description theme="gray" color="$color11">
            {description}
          </AlertDialog.Description>

          <XStack gap="$2" mt="$2">
            <AlertDialog.Cancel asChild>
              <Button flex={1} size="$4" rounded="$7">
                닫기
              </Button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <Button
                flex={1}
                size="$4"
                theme={destructive ? "red" : "blue"}
                rounded="$7"
                onPress={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </XStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  );
}
