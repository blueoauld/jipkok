import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, XStack, YStack } from "tamagui";

import { PhoneCountryButton } from "@/components/PhoneCountryButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RetroFormDialog } from "@/components/ui/RetroFormDialog";
import { maxLengthOf, patternOf, toE164 } from "@/lib/phone";
import { usePhoneCountry } from "@/lib/phone/store";
import { CONTACT_BLOCK_MEMO_MAX_LENGTH } from "@/lib/validation";

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
  onSubmit: (phoneNumber: string, memo: string | undefined) => void;
  onInvalid: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const defaultCountry = usePhoneCountry();
  const [country, setCountry] = useState(defaultCountry);
  const [value, setValue] = useState("");
  const [memo, setMemo] = useState("");

  const digits = value.replace(/\D/g, "");
  const valid = patternOf(country).test(digits);

  // 버튼은 형식이 맞을 때만 눌리고, 키보드의 완료로 들어오는 길만 경고를 낸다.
  const submit = () => {
    if (!valid) {
      onInvalid();
      return;
    }

    onClose();
    onSubmit(toE164(digits, country), memo.trim() || undefined);
  };

  return (
    <>
      <Dialog.Title fontSize="$6">{title}</Dialog.Title>

      <YStack gap="$3">
        <XStack gap="$2" items="flex-start">
          <PhoneCountryButton country={country} onChange={setCountry} />

          <YStack flex={1}>
            <Input
              value={value}
              onChangeText={setValue}
              placeholder={t("auth.phoneNumberPlaceholder")}
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              maxLength={maxLengthOf(country)}
              clearable
              autoFocusNative
            />
          </YStack>
        </XStack>

        <Input
          value={memo}
          onChangeText={setMemo}
          placeholder={t("contactBlock.memoPlaceholder")}
          maxLength={CONTACT_BLOCK_MEMO_MAX_LENGTH}
          submitBehavior="submit"
          onSubmitEditing={submit}
          clearable
        />
      </YStack>

      <XStack gap="$3">
        <Button flex={1} variant="secondary" onPress={onClose}>
          {t("component.close")}
        </Button>

        <Button flex={1} disabled={!valid} onPress={submit}>
          {submitLabel}
        </Button>
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
  onSubmit: (phoneNumber: string, memo: string | undefined) => void;
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
