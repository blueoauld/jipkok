import { useState } from "react";
import { useTranslation } from "react-i18next";

import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { RetroButton } from "@/components/ui/RetroButton";
import { COUNTRY_BUTTON_MIN_WIDTH } from "@/lib/design";
import { type PhoneCountry, SUPPORTED_COUNTRIES } from "@/lib/phone/country";

const COUNTRY_LABEL_KEYS = {
  KR: "auth.countryKR",
  JP: "auth.countryJP",
  TW: "auth.countryTW",
} as const satisfies Record<PhoneCountry, string>;

export function PhoneCountryButton({
  country,
  onChange,
}: {
  country: PhoneCountry;
  onChange: (country: PhoneCountry) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const items: MenuSheetItem[] = SUPPORTED_COUNTRIES.map((value) => ({
    label: t(COUNTRY_LABEL_KEYS[value]),
    selected: value === country,
    onPress: () => onChange(value),
  }));

  return (
    <>
      <RetroButton
        theme="purple"
        shadow="$gray8"
        minW={COUNTRY_BUTTON_MIN_WIDTH}
        onPress={() => setOpen(true)}
      >
        {country}
      </RetroButton>

      <MenuSheet open={open} onOpenChange={setOpen} items={items} />
    </>
  );
}
