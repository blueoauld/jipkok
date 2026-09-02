import type { ReactNode } from "react";
import { useState } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { RetroButton } from "@/components/ui/RetroButton";
import { COUNTRY_BUTTON_MIN_WIDTH } from "@/lib/design";
import { maxLengthOf } from "@/lib/phone";
import { type PhoneCountry, SUPPORTED_COUNTRIES } from "@/lib/phone/country";
import { usePhoneCountry, usePhoneCountryStore } from "@/lib/phone/store";
import { phoneNumberRules } from "@/lib/validation";

const COUNTRY_LABEL_KEYS = {
  KR: "auth.countryKR",
  JP: "auth.countryJP",
  TW: "auth.countryTW",
} as const satisfies Record<PhoneCountry, string>;

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
  const [open, setOpen] = useState(false);
  const country = usePhoneCountry();
  const setCountry = usePhoneCountryStore((state) => state.setCountry);

  const items: MenuSheetItem[] = SUPPORTED_COUNTRIES.map((value) => ({
    label: t(COUNTRY_LABEL_KEYS[value]),
    selected: value === country,
    onPress: () => setCountry(value),
  }));

  return (
    <>
      <XStack gap="$2" items="flex-start">
        <RetroButton
          theme="purple"
          shadow="$gray8"
          minW={COUNTRY_BUTTON_MIN_WIDTH}
          onPress={() => setOpen(true)}
        >
          {country}
        </RetroButton>

        <YStack flex={1}>
          <ControlledInput
            control={control}
            name={name}
            rules={phoneNumberRules(country)}
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

      <MenuSheet open={open} onOpenChange={setOpen} items={items} />
    </>
  );
}
