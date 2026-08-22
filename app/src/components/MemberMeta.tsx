import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { useTranslation } from "react-i18next";
import { Text, useTheme, XStack } from "tamagui";

import type { Gender } from "@/lib/api";
import { genderLabel } from "@/lib/member";

const SIZES = {
  sm: { fontSize: "$3", icon: 13 },
  md: { fontSize: "$4", icon: 14 },
} as const;

export function MemberMeta({
  gender,
  age,
  receivedLikeCount,
  size = "sm",
}: {
  gender: Gender;
  age: number;
  receivedLikeCount: number;
  size?: keyof typeof SIZES;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { fontSize, icon } = SIZES[size];

  return (
    <XStack items="center">
      <Text fontSize={fontSize}>
        {t("component.metaLine", { gender: genderLabel(gender), age })}
      </Text>

      <XStack items="center" gap="$1">
        <HeartIcon size={icon} weight="fill" color={theme.color12.val} />

        <Text fontSize={fontSize}>{receivedLikeCount}</Text>
      </XStack>
    </XStack>
  );
}
