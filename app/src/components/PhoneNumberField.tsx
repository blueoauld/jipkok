import type { ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { PhoneCountryButton } from "@/components/PhoneCountryButton";
import { maxLengthOf } from "@/lib/phone";
import { usePhoneCountry, usePhoneCountryStore } from "@/lib/phone/store";
import { PHONE_NUMBER_RULES } from "@/lib/validation";

export function PhoneNumberField<T extends FieldValues>({
  control,
  name,
  right,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  right?: ReactNode;
}) {
  const { t } = useTranslation();
  const country = usePhoneCountry();
  const setCountry = usePhoneCountryStore((state) => state.setCountry);

  return (
    <>
      <XStack gap="$2" items="flex-start">
        <PhoneCountryButton country={country} onChange={setCountry} />

        <YStack flex={1}>
          <ControlledInput
            control={control}
            name={name}
            rules={PHONE_NUMBER_RULES}
            placeholder={t("auth.phoneNumberPlaceholder")}
            keyboardType="number-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            maxLength={maxLengthOf(country)}
            clearable
          />
        </YStack>

        {right}
      </XStack>
    </>
  );
}
