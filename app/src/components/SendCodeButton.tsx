import { useTranslation } from "react-i18next";
import { Spinner } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { formatCountdown } from "@/lib/date";
import { SEND_CODE_BUTTON_MIN_WIDTH } from "@/lib/design";

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
    <RetroButton
      minW={SEND_CODE_BUTTON_MIN_WIDTH}
      disabled={disabled}
      onPress={onPress}
    >
      {sending ? (
        <Spinner color="$color11" />
      ) : remaining > 0 ? (
        formatCountdown(remaining)
      ) : (
        t("auth.sendCode")
      )}
    </RetroButton>
  );
}
