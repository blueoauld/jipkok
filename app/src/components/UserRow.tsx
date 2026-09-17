import * as Haptics from "expo-haptics";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Text, XStack } from "tamagui";

import { MemberMeta } from "@/components/MemberMeta";
import { Button } from "@/components/ui/Button";
import {
  ListRow,
  ListRowSeparator,
  ListRowTopSpacer,
} from "@/components/ui/ListRow";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { USER_AVATAR_SIZE, UserAvatar } from "@/components/UserAvatar";
import type { MemberListItemResponse, MemberSummaryResponse } from "@/lib/api";
import { FAVORITE_COLOR } from "@/lib/color";
import { LIST_ROW_LEFT_GAP, LIST_ROW_PADDING_X } from "@/lib/design";
import { formatDistance } from "@/lib/member";
import { pushOnce } from "@/lib/router";

const EMPTY_COMMENT = "-";
const FAVORITE_ICON_SIZE = 14;

// 글자 세 줄의 높이다. 이름은 $4 줄높이 26, 아래 두 줄은 $2 줄높이 23이다.
const TEXT_HEIGHT = 26 + 23 * 2;

type RowMember = MemberSummaryResponse & Partial<MemberListItemResponse>;

// 행 사이 선은 사진을 건너 글자 시작에 맞춰 들여쓴다.
export function UserRowSeparator() {
  return (
    <ListRowSeparator
      inset={LIST_ROW_PADDING_X.small + USER_AVATAR_SIZE + LIST_ROW_LEFT_GAP}
    />
  );
}

// 사진이 글자 세 줄보다 낮아 행 안에서 위아래로 뜨므로, 행 사이 흰 공간에는 뜬 만큼이 두 번 들어간다.
// 목록 맨 위에도 뜬 만큼을 더해 첫 사진 위 공간을 이와 맞춘다.
export function UserRowTopSpacer() {
  return <ListRowTopSpacer extra={(TEXT_HEIGHT - USER_AVATAR_SIZE) / 2} />;
}

function Row({
  member,
  at,
  onDelete,
}: {
  member: RowMember;
  at?: string;
  onDelete?: (memberId: number) => void;
}) {
  const { t } = useTranslation();
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
  const time = at ?? locatedAt;

  return (
    <ListRow
      horizontalPadding="small"
      left={
        <UserAvatar
          id={String(memberId)}
          url={profileImageUrl}
          gender={gender}
        />
      }
      right={
        onDelete && (
          <Button
            size="small"
            variant="secondary"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDelete(memberId);
            }}
          >
            {t("action.delete")}
          </Button>
        )
      }
      onPress={() => pushOnce(`/member/${memberId}`)}
    >
      <XStack items="center" gap="$1.5">
        <Text
          shrink={0}
          fontSize="$4"
          lineHeight="$4"
          fontWeight="500"
          color="$grey800"
        >
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
            lineHeight="$2"
            color="$grey600"
          >
            {memo}
          </Text>
        )}
      </XStack>

      <XStack items="center" justify="space-between" gap="$2">
        <MemberMeta
          gender={gender}
          age={age}
          receivedLikeCount={receivedLikeCount}
        />

        {time && <RelativeTime at={time} fontSize="$1" color="$grey500" />}
      </XStack>

      <XStack items="center" justify="space-between" gap="$2">
        <Text
          flex={1}
          numberOfLines={1}
          fontSize="$2"
          lineHeight="$2"
          color="$grey600"
        >
          {comment || EMPTY_COMMENT}
        </Text>

        {distance != null && (
          <Text shrink={0} fontSize="$1" color="$grey500">
            {formatDistance(distance)}
          </Text>
        )}
      </XStack>
    </ListRow>
  );
}

export const UserRow = memo(Row);
