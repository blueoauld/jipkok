import { useState } from "react";
import { useTranslation } from "react-i18next";

import { choiceItems, MenuSheet } from "@/components/MenuSheet";
import { Button } from "@/components/ui/Button";
import { COUNTRY_BUTTON_MIN_WIDTH, INPUT_HEIGHT } from "@/lib/design";
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

  const items = choiceItems({
    values: SUPPORTED_COUNTRIES,
    selected: country,
    label: (value) => t(COUNTRY_LABEL_KEYS[value]),
    onSelect: onChange,
  });

  return (
    <>
      <Button
        variant="secondary"
        minW={COUNTRY_BUTTON_MIN_WIDTH}
        minH={INPUT_HEIGHT}
        accessibilityLabel={t(COUNTRY_LABEL_KEYS[country])}
        onPress={() => setOpen(true)}
      >
        {country}
      </Button>

      <MenuSheet open={open} onOpenChange={setOpen} items={items} />
    </>
  );
}
