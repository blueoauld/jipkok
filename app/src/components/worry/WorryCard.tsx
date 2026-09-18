import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { XStack } from "tamagui";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { WorryCount } from "@/components/worry/WorryCount";
import { WorryPostHeader } from "@/components/worry/WorryPostHeader";
import type { WorryPostResponse } from "@/lib/api";

const CONTENT_MAX_LINES = 3;
function Item({
  worry,
  onPress,
}: {
  worry: WorryPostResponse;
  onPress: (worryId: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card accessible gap="$2.5" onPress={() => onPress(worry.worryId)}>
      <WorryPostHeader post={worry} />

      <Text preset="body" numberOfLines={CONTENT_MAX_LINES} color="$grey800">
        {worry.content}
      </Text>

      <XStack gap="$4">
        <WorryCount
          icon={HeartIcon}
          label={t("a11y.like")}
          value={worry.likeCount}
        />
        <WorryCount
          icon={ChatCircleIcon}
          label={t("a11y.comment")}
          value={worry.commentCount}
        />
      </XStack>
    </Card>
  );
}

export const WorryCard = memo(Item);
