import { Text, XStack, YStack } from "tamagui";

import { MemberMeta } from "@/components/MemberMeta";
import { RelativeTime } from "@/components/ui/RelativeTime";
import type { Gender } from "@/lib/api";
import { SCREEN_PADDING } from "@/lib/design";
import { formatDistance } from "@/lib/member";

// TDS Top에서 잰 값이다. 위아래를 24씩 띄우고, 제목 아래 줄은 4 떨어진다.
const PADDING_Y = 24;
const SUBTITLE_GAP = 4;

// 프로필 사진 아래 이름 영역이다. 메모는 회원 목록처럼 닉네임 옆에 한 줄로 두고, 시간과 거리는 목록 행처럼
// 각 줄 오른쪽 끝에 둔다.
export function ProfileHeader({
  nickname,
  gender,
  age,
  receivedLikeCount,
  locatedAt,
  distance,
  memo,
  onLongPressNickname,
}: {
  nickname: string;
  gender: Gender;
  age: number;
  receivedLikeCount: number;
  locatedAt?: string | null;
  distance?: number | null;
  memo?: string | null;
  onLongPressNickname?: () => void;
}) {
  return (
    <YStack px={SCREEN_PADDING} py={PADDING_Y} gap={SUBTITLE_GAP}>
      <XStack items="center" justify="space-between" gap="$2">
        <XStack flex={1} items="center" gap="$1.5">
          <Text
            shrink={0}
            fontSize="$6"
            lineHeight="$6"
            fontWeight="700"
            color="$grey800"
            onLongPress={onLongPressNickname}
          >
            {nickname}
          </Text>

          {memo && (
            <Text
              shrink={1}
              numberOfLines={1}
              fontSize="$2"
              lineHeight="$2"
              color="$grey600"
            >
              {memo}
            </Text>
          )}
        </XStack>

        {locatedAt && <RelativeTime at={locatedAt} />}
      </XStack>

      <XStack items="center" justify="space-between" gap="$2">
        <XStack flex={1}>
          <MemberMeta
            gender={gender}
            age={age}
            receivedLikeCount={receivedLikeCount}
            size="md"
          />
        </XStack>

        {distance != null && (
          <Text shrink={0} fontSize="$1" color="$grey500">
            {formatDistance(distance)}
          </Text>
        )}
      </XStack>
    </YStack>
  );
}
