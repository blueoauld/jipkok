import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { formatCountdown } from "@/lib/date";
import { INPUT_HEIGHT, SEND_CODE_BUTTON_MIN_WIDTH } from "@/lib/design";

export function SendCodeButton({
  sending,
  remaining,
  disabled,
  onPress,
}: {
  sending: boolean;
  remaining: number;
  disabled: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Button
      minW={SEND_CODE_BUTTON_MIN_WIDTH}
      minH={INPUT_HEIGHT}
      disabled={disabled}
      loading={sending}
      onPress={onPress}
    >
      {remaining > 0 ? formatCountdown(remaining) : t("auth.sendCode")}
    </Button>
  );
}
