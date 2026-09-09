import { Image } from "expo-image";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import type { DiaryResponse } from "@/lib/api";
import { formatFullDate, fromDateParam } from "@/lib/date";
import { IMAGE_TRANSITION, RETRO_BORDER_WIDTH } from "@/lib/design";
import { moodEmoji } from "@/lib/diary";
import { photoCacheKey } from "@/lib/photo";

const THUMBNAIL_SIZE = 56;

export function DiaryCard({
  diary,
  onPress,
}: {
  diary: DiaryResponse;
  onPress: (entryDate: string) => void;
}) {
  const theme = useTheme();
  const emoji = moodEmoji(diary.mood);
  const cover = diary.attachments[0];
  const coverUri = cover ? (cover.thumbnailUrl ?? cover.url) : null;

  return (
    <RetroCard onPress={() => onPress(diary.entryDate)}>
      <XStack items="center" gap="$3">
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600">
            {emoji ? `${emoji} ` : ""}
            {formatFullDate(fromDateParam(diary.entryDate))}
          </Text>
          {diary.content != null && (
            <Text theme="gray" color="$color11" fontSize="$3" numberOfLines={2}>
              {diary.content}
            </Text>
          )}
        </YStack>

        {coverUri && (
          <Image
            source={{ uri: coverUri, cacheKey: photoCacheKey(coverUri) }}
            contentFit="cover"
            transition={IMAGE_TRANSITION}
            style={{
              width: THUMBNAIL_SIZE,
              height: THUMBNAIL_SIZE,
              borderWidth: RETRO_BORDER_WIDTH,
              borderColor: theme.gray12.val,
              backgroundColor: theme.gray12.val,
            }}
          />
        )}
      </XStack>
    </RetroCard>
  );
}
