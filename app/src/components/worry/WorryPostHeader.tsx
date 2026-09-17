import { useTranslation } from "react-i18next";
import { Text, XStack } from "tamagui";

import { RelativeTime } from "@/components/ui/RelativeTime";
import { WorryCategoryTag } from "@/components/worry/WorryCategoryTag";
import type { WorryPostResponse } from "@/lib/api";

export function WorryPostHeader({ post }: { post: WorryPostResponse }) {
  const { t } = useTranslation();

  return (
    <XStack items="center" justify="space-between">
      <XStack items="center" gap="$2">
        <WorryCategoryTag category={post.category} />
        <Text fontSize="$2" lineHeight="$2" fontWeight="600" color="$grey800">
          {post.mine ? t("worry.detail.mine") : t("worry.detail.anonymous")}
        </Text>
      </XStack>
      <RelativeTime at={post.createdAt} />
    </XStack>
  );
}
