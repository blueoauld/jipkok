import { Fragment, type ReactNode, useState } from "react";
import { Dialog, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { useCloseOnGoBack } from "@/hooks/useCloseOnGoBack";
import { useDialogKeyboardOffset } from "@/hooks/useDialogKeyboardOffset";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import {
  DIALOG_ENTER_SCALE,
  OVERLAY_BG,
  RETRO_BORDER_WIDTH,
  TRANSITION,
} from "@/lib/design";

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
  const visible = useVisibleWhenUnlocked(open);

  useCloseOnGoBack(visible, () => onOpenChange(false));

  // 열 때마다 새로 만들어 지난번 입력이 남지 않게 한다. 닫힐 때는 나가는 전환 동안
  // 그대로 둬야 새 입력칸이 다시 포커스를 잡아 키보드를 망가뜨리지 않는다.
  // 잠금으로 숨은 것은 여는 것이 아니므로 open으로만 센다.
  const [session, setSession] = useState({ open, id: 0 });

  if (session.open !== open) {
    setSession({ open, id: open ? session.id + 1 : session.id });
  }

  return (
    <Dialog modal open={visible} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          bg={OVERLAY_BG}
          transition={TRANSITION}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

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
          transition={TRANSITION}
          enterStyle={{ opacity: 0, scale: DIALOG_ENTER_SCALE }}
          exitStyle={{ opacity: 0, scale: DIALOG_ENTER_SCALE }}
        >
          <YStack>
            <RetroShadow color="$gray12" />
            <YStack
              borderWidth={RETRO_BORDER_WIDTH}
              borderColor="$gray12"
              bg="$color1"
              p="$4"
              gap="$4"
            >
              <Fragment key={session.id}>{children}</Fragment>
            </YStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
