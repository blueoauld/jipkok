import { Fragment, type ReactNode } from "react";
import { Dialog, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { useDialogKeyboardOffset } from "@/hooks/useDialogKeyboardOffset";
import { OVERLAY_BG, RETRO_BORDER_WIDTH } from "@/lib/design";

export function RetroFormDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const keyboardOffset = useDialogKeyboardOffset();

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay bg={OVERLAY_BG} />

        <Dialog.Content
          width="85%"
          maxW={400}
          p={0}
          bg="transparent"
          rounded={0}
          borderWidth={0}
          elevation={0}
          shadowOpacity={0}
          y={keyboardOffset}
        >
          <YStack>
            <RetroShadow color="$gray12" />
            <YStack
              borderWidth={RETRO_BORDER_WIDTH}
              borderColor="$color12"
              bg="$color1"
              p="$4"
              gap="$4"
            >
              {/* 열 때마다 새로 만들어 지난번 입력이 남지 않게 한다. */}
              <Fragment key={String(open)}>{children}</Fragment>
            </YStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
