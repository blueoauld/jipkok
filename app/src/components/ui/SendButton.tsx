import { PaperPlaneRightIcon } from "phosphor-react-native/src/icons/PaperPlaneRight";
import { Spinner, useTheme } from "tamagui";

import { CircleButton } from "@/components/ui/CircleButton";

const ICON_SIZE = 22;

// 입력줄 오른쪽 끝의 보내기 버튼이다. 보낼 게 없으면 회색으로 두고 누르지 못하게 한다.
export function SendButton({
  label,
  sendable,
  pending = false,
  onPress,
}: {
  label: string;
  sendable: boolean;
  pending?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <CircleButton
      label={label}
      tone={sendable ? "blue" : "grey"}
      onPress={sendable ? onPress : undefined}
    >
      {pending ? (
        <Spinner size="small" color="$grey500" />
      ) : (
        <PaperPlaneRightIcon
          size={ICON_SIZE}
          weight="fill"
          color={sendable ? theme.onFill.val : theme.grey400.val}
        />
      )}
    </CircleButton>
  );
}
