import * as Haptics from "expo-haptics";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Text, useTheme, XStack } from "tamagui";

import { MemberMeta } from "@/components/MemberMeta";
import { Button } from "@/components/ui/Button";
import { ListRow, ListRowTopSpacer } from "@/components/ui/ListRow";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { USER_AVATAR_SIZE, UserAvatar } from "@/components/UserAvatar";
import type { MemberListItemResponse, MemberSummaryResponse } from "@/lib/api";
import { LIST_ROW_EVEN_PADDING_Y } from "@/lib/design";
import { formatDistance } from "@/lib/member";
import { pushOnce } from "@/lib/router";

const EMPTY_COMMENT = "-";
const FAVORITE_ICON_SIZE = 14;

// 글자 세 줄의 높이다. 이름은 $4 줄높이 26, 아래 두 줄은 $2 줄높이 23이다.
const TEXT_HEIGHT = 26 + 23 * 2;

// 사진이 글자 세 줄보다 낮아 행 안에서 위아래로 뜨는 거리다.
const AVATAR_FLOAT = (TEXT_HEIGHT - USER_AVATAR_SIZE) / 2;

// 사진 사이 세로 간격이 사진 왼쪽 여백과 같아지도록, 글자 행의 위아래 여백에서 사진이 뜬 거리를 뺀다.
const ROW_PADDING_Y = LIST_ROW_EVEN_PADDING_Y - AVATAR_FLOAT;

type RowMember = MemberSummaryResponse & Partial<MemberListItemResponse>;

// 목록 맨 위에도 뜬 거리를 더해 첫 사진 위 공간을 사진 사이 간격과 맞춘다.
export function UserRowTopSpacer() {
  return (
    <ListRowTopSpacer verticalPadding={ROW_PADDING_Y} extra={AVATAR_FLOAT} />
  );
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
    memo,
  } = member;
  const time = at ?? locatedAt;

  return (
    <ListRow
      horizontalPadding="small"
      verticalPadding={ROW_PADDING_Y}
      left={
        <UserAvatar
          id={String(memberId)}
          url={profileImageUrl}
          gender={gender}
        />
      }
      accessible={onDelete === undefined}
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
            color={theme.yellow500.val}
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

        {time && <RelativeTime at={time} />}
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
