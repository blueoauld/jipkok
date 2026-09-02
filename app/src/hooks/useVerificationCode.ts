import { useMutation } from "@tanstack/react-query";

import { useCountdown } from "@/hooks/useCountdown";
import { api, type VerificationPurpose } from "@/lib/api";
import { codeSentMessage } from "@/lib/message";
import { patternOf } from "@/lib/phone";
import { usePhoneCountry } from "@/lib/phone/store";
import { showToast } from "@/lib/toast/store";

// 서버 VerificationCodeService.RESEND_COOLDOWN과 같다.
const RESEND_COOLDOWN_SECONDS = 30;

// 서버 VerificationCodeService.CODE_TIME_TO_LIVE와 같다.
const CODE_TIME_TO_LIVE_SECONDS = 180;

export function useVerificationCode({
  purpose,
  onSent,
  onError,
}: {
  purpose: VerificationPurpose;
  onSent?: () => void;
  onError: (error: unknown) => void;
}) {
  const cooldown = useCountdown();
  const expiry = useCountdown();
  const country = usePhoneCountry();

  const { mutate: send, isPending: sending } = useMutation({
    mutationFn: (phoneNumber: string) =>
      api.auth.sendVerificationCode(phoneNumber, purpose),
    onSuccess: () => {
      onSent?.();
      cooldown.start(RESEND_COOLDOWN_SECONDS);
      expiry.start(CODE_TIME_TO_LIVE_SECONDS);
      showToast("info", codeSentMessage());
    },
    onError,
  });

  const canSend = (phoneNumber: string) =>
    patternOf(country).test(phoneNumber) &&
    !sending &&
    cooldown.remaining === 0;

  return { send, sending, canSend, expiryRemaining: expiry.remaining };
}
