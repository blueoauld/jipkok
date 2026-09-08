import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, XStack, YStack } from "tamagui";

import { PhoneCountryButton } from "@/components/PhoneCountryButton";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroFormDialog } from "@/components/ui/RetroFormDialog";
import { RetroInput } from "@/components/ui/RetroInput";
import { maxLengthOf, patternOf, toE164 } from "@/lib/phone";
import { usePhoneCountry } from "@/lib/phone/store";

// 나라는 이 다이얼로그 안에서만 고른다. 로그인 화면의 기본 나라를 바꾸지 않는다.
function DialogForm({
  title,
  submitLabel,
  onSubmit,
  onInvalid,
  onClose,
}: {
  title: string;
  submitLabel: string;
  onSubmit: (phoneNumber: string) => void;
  onInvalid: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const defaultCountry = usePhoneCountry();
  const [country, setCountry] = useState(defaultCountry);
  const [value, setValue] = useState("");

  const submit = () => {
    const digits = value.replace(/\D/g, "");

    if (!patternOf(country).test(digits)) {
      onInvalid();
      return;
    }

    onClose();
    onSubmit(toE164(digits, country));
  };

  return (
    <>
      <Dialog.Title fontSize="$6">{title}</Dialog.Title>

      <XStack gap="$2" items="flex-start">
        <PhoneCountryButton country={country} onChange={setCountry} />

        <YStack flex={1}>
          <RetroInput
            value={value}
            onChangeText={setValue}
            placeholder={t("auth.phoneNumberPlaceholder")}
            keyboardType="number-pad"
            textContentType="telephoneNumber"
            maxLength={maxLengthOf(country)}
            submitBehavior="submit"
            onSubmitEditing={submit}
            clearable
            autoFocusNative
          />
        </YStack>
      </XStack>

      <XStack gap="$3">
        <RetroButton flex={1} theme="gray" onPress={onClose}>
          {t("component.close")}
        </RetroButton>

        <RetroButton flex={1} onPress={submit}>
          {submitLabel}
        </RetroButton>
      </XStack>
    </>
  );
}

export function PhoneInputDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  onSubmit,
  onInvalid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  onSubmit: (phoneNumber: string) => void;
  onInvalid: () => void;
}) {
  return (
    <RetroFormDialog open={open} onOpenChange={onOpenChange}>
      <DialogForm
        title={title}
        submitLabel={submitLabel}
        onSubmit={onSubmit}
        onInvalid={onInvalid}
        onClose={() => onOpenChange(false)}
      />
    </RetroFormDialog>
  );
}
