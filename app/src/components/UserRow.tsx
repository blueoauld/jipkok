import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { memo } from "react";
import { Text, XStack, YStack } from "tamagui";

import { MemberMeta } from "@/components/MemberMeta";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroDeleteButton } from "@/components/ui/RetroDeleteButton";
import { UserAvatar } from "@/components/UserAvatar";
import type { MemberListItemResponse, MemberSummaryResponse } from "@/lib/api";
import { FAVORITE_COLOR } from "@/lib/color";
import { formatDistance } from "@/lib/member";
import { pushOnce } from "@/lib/router";

const EMPTY_COMMENT = "-";
const FAVORITE_ICON_SIZE = 14;

type RowMember = MemberSummaryResponse & Partial<MemberListItemResponse>;

function Row({
  member,
  at,
  onDelete,
}: {
  member: RowMember;
  at?: string;
  onDelete?: (memberId: number) => void;
}) {
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
    memo,
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
              <Text shrink={0} fontSize="$4" fontWeight="600">
                {nickname}
              </Text>

              {favoritedByMe && (
                <StarIcon
                  size={FAVORITE_ICON_SIZE}
                  weight="fill"
                  color={FAVORITE_COLOR}
                />
              )}

              {memo && (
                <Text
                  shrink={1}
                  numberOfLines={1}
                  fontSize="$2"
                  color="$color11"
                >
                  {memo}
                </Text>
              )}
            </XStack>

            {(at ?? locatedAt) && <RelativeTime at={at ?? locatedAt!} />}
          </XStack>

          <MemberMeta
            gender={gender}
            age={age}
            receivedLikeCount={receivedLikeCount}
          />

          <XStack items="center" justify="space-between" gap="$2">
            <Text flex={1} numberOfLines={1} fontSize="$2">
              {comment || EMPTY_COMMENT}
            </Text>

            {distance != null && (
              <Text theme="gray" shrink={0} fontSize="$2" color="$color11">
                {formatDistance(distance)}
              </Text>
            )}
          </XStack>
        </YStack>

        {onDelete && <RetroDeleteButton onPress={() => onDelete(memberId)} />}
      </XStack>
    </RetroCard>
  );
}

export const UserRow = memo(Row);
