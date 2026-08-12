import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { memo } from "react";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { RelativeTime } from "@/components/ui/RelativeTime";
import { RetroCard } from "@/components/ui/RetroCard";
import { UserAvatar } from "@/components/UserAvatar";
import type { MemberListItemResponse, MemberSummaryResponse } from "@/lib/api";
import { FAVORITE_COLOR } from "@/lib/color";
import { formatDistance, genderLabel } from "@/lib/member";
import { pushOnce } from "@/lib/router";

const EMPTY_COMMENT = "-";
const FAVORITE_ICON_SIZE = 14;
const LIKE_ICON_SIZE = 13;

type RowMember = MemberSummaryResponse & Partial<MemberListItemResponse>;

function Row({ member }: { member: RowMember }) {
  const theme = useTheme();
  const {
    memberId,
    nickname,
    gender,
    age,
    receivedLikeCount,
    comment,
    profileImageUrl,
    locatedAt,
    distance,
    favoritedByMe,
  } = member;

  return (
    <RetroCard onPress={() => pushOnce(`/member/${memberId}`)}>
      <XStack gap="$3" items="center">
        <UserAvatar
          id={String(memberId)}
          url={profileImageUrl}
          gender={gender}
        />

        <YStack flex={1} gap="$1">
          <XStack items="center" justify="space-between" gap="$2">
            <XStack flex={1} items="center" gap="$1.5">
              <Text shrink={1} numberOfLines={1} fontSize="$4" fontWeight="600">
                {nickname}
              </Text>

              {favoritedByMe && (
                <StarIcon
                  size={FAVORITE_ICON_SIZE}
                  weight="fill"
                  color={FAVORITE_COLOR}
                />
              )}
            </XStack>

            {locatedAt && <RelativeTime at={locatedAt} />}
          </XStack>

          <XStack items="center">
            <Text fontSize="$3">{`${genderLabel(gender)} · ${age}살 · `}</Text>

            <XStack items="center" gap="$1">
              <HeartIcon
                size={LIKE_ICON_SIZE}
                weight="fill"
                color={theme.color12.val}
              />

              <Text fontSize="$3">{receivedLikeCount}</Text>
            </XStack>
          </XStack>

          <XStack items="center" justify="space-between" gap="$2">
            <Text flex={1} numberOfLines={1} fontSize="$3">
              {comment || EMPTY_COMMENT}
            </Text>

            {distance !== undefined && distance !== null && (
              <Text shrink={0} fontSize="$2">
                {formatDistance(distance)}
              </Text>
            )}
          </XStack>
        </YStack>
      </XStack>
    </RetroCard>
  );
}

export const UserRow = memo(Row);
