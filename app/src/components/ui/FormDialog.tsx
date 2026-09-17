import { Fragment, type ReactNode, useState } from "react";
import { useWindowDimensions } from "react-native";
import { Dialog, YStack } from "tamagui";

import { useCloseOnGoBack } from "@/hooks/useCloseOnGoBack";
import { useDialogKeyboardOffset } from "@/hooks/useDialogKeyboardOffset";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import {
  DIALOG_BUTTON_PADDING,
  DIALOG_ENTER_SCALE,
  DIALOG_RADIUS,
  DIALOG_TEXT_PADDING,
  DIALOG_WIDTH,
  SCREEN_PADDING,
  TRANSITION,
} from "@/lib/design";

const FIELD_GAP = 16;

// 입력칸과 버튼은 TDS 다이얼로그의 버튼 자리에 맞추고, 제목 글자만 설명 글자 자리까지 더 들인다.
export function FormDialogTitle({ children }: { children: string }) {
  return (
    <Dialog.Title
      unstyled
      px={DIALOG_TEXT_PADDING - DIALOG_BUTTON_PADDING}
      fontFamily="$body"
      fontSize="$6"
      lineHeight="$6"
      fontWeight="700"
      color="$grey800"
    >
      {children}
    </Dialog.Title>
  );
}

export function FormDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
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
          bg="$dimmedBackground"
          transition={TRANSITION}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Dialog.Content
          width={Math.min(width - SCREEN_PADDING * 2, DIALOG_WIDTH)}
          p={0}
          bg="$floatBackground"
          rounded={DIALOG_RADIUS}
          borderWidth={0}
          elevation={0}
          shadowOpacity={0}
          y={keyboardOffset}
          transition={TRANSITION}
          enterStyle={{ opacity: 0, scale: DIALOG_ENTER_SCALE }}
          exitStyle={{ opacity: 0, scale: DIALOG_ENTER_SCALE }}
        >
          <YStack
            pt={DIALOG_TEXT_PADDING}
            px={DIALOG_BUTTON_PADDING}
            pb={DIALOG_BUTTON_PADDING}
            gap={FIELD_GAP}
          >
            <Fragment key={session.id}>{children}</Fragment>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
