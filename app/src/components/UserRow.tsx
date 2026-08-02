import { Text, XStack, YStack } from "tamagui";

import { UserAvatar } from "@/components/UserAvatar";
import { useNow } from "@/hooks/useNow";
import type { MemberListItemResponse } from "@/lib/api";
import { formatRelativeTime } from "@/lib/date";
import { formatDistance, genderLabel } from "@/lib/member";
import { pushOnce } from "@/lib/router";

const EMPTY_COMMENT = "-";

export function UserRow({ member }: { member: MemberListItemResponse }) {
  const now = useNow();
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
  } = member;

  return (
    <XStack
      gap="$3"
      items="center"
      pressStyle={{ opacity: 0.6 }}
      onPress={() => pushOnce(`/member/${memberId}`)}
    >
      <UserAvatar id={String(memberId)} url={profileImageUrl} />

      <YStack flex={1} gap="$1">
        <XStack items="center" justify="space-between" gap="$2">
          <Text flex={1} numberOfLines={1} fontSize="$4" fontWeight="600">
            {nickname}
          </Text>

          {locatedAt && (
            <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
              {formatRelativeTime(locatedAt, now)}
            </Text>
          )}
        </XStack>

        <Text theme="gray" color="$color10" fontSize="$3">
          {`${genderLabel(gender)} · ${age}살 · ♥ ${receivedLikeCount}`}
        </Text>

        <XStack items="center" justify="space-between" gap="$2">
          <Text
            flex={1}
            numberOfLines={1}
            theme="gray"
            color="$color10"
            fontSize="$3"
          >
            {comment || EMPTY_COMMENT}
          </Text>

          {distance !== undefined && distance !== null && (
            <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
              {formatDistance(distance)}
            </Text>
          )}
        </XStack>
      </YStack>
    </XStack>
  );
}
