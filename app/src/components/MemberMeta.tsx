import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { useTranslation } from "react-i18next";
import { Text, useTheme, XStack } from "tamagui";

import type { Gender } from "@/lib/api";
import { genderLabel } from "@/lib/member";

// sm은 회원 행의 가운데 줄이라 TDS ListRow 2RowTypeA 아래 글자(15, 400, grey600)를 따른다.
const SIZES = {
  sm: {
    fontSize: "$2",
    lineHeight: "$2",
    fontWeight: "400",
    color: "grey600",
    icon: 14,
  },
  md: {
    fontSize: "$4",
    lineHeight: undefined,
    fontWeight: "400",
    color: "color12",
    icon: 14,
  },
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
  const { fontSize, lineHeight, fontWeight, color, icon } = SIZES[size];

  return (
    <XStack items="center">
      <Text
        fontSize={fontSize}
        lineHeight={lineHeight}
        fontWeight={fontWeight}
        color={`$${color}`}
      >
        {t("component.metaLine", { gender: genderLabel(gender), age })}
      </Text>

      <XStack items="center" gap="$1">
        <HeartIcon size={icon} weight="fill" color={theme[color].val} />

        <Text
          fontSize={fontSize}
          lineHeight={lineHeight}
          fontWeight={fontWeight}
          color={`$${color}`}
        >
          {receivedLikeCount}
        </Text>
      </XStack>
    </XStack>
  );
}
