import * as Haptics from "expo-haptics";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { memo } from "react";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { RelativeTime } from "@/components/ui/RelativeTime";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroShadow } from "@/components/ui/RetroShadow";
import { UserAvatar } from "@/components/UserAvatar";
import type { MemberSummaryResponse } from "@/lib/api";
import { RETRO_BORDER_WIDTH, RETRO_SHADOW_OFFSET_SM } from "@/lib/design";
import { genderLabel } from "@/lib/member";
import { pushOnce } from "@/lib/router";

const EMPTY_COMMENT = "-";
const LIKE_ICON_SIZE = 13;

const DELETE_BUTTON_SIZE = 44;
const DELETE_ICON_SIZE = 22;
function DeleteButton({ onPress }: { onPress: () => void }) {
  const press = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <YStack shrink={0}>
      <RetroShadow color="$gray12" offset={RETRO_SHADOW_OFFSET_SM} />
      <XStack
        width={DELETE_BUTTON_SIZE}
        height={DELETE_BUTTON_SIZE}
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        bg="$red10"
        items="center"
        justify="center"
        pressStyle={{
          x: RETRO_SHADOW_OFFSET_SM,
          y: RETRO_SHADOW_OFFSET_SM,
          bg: "$red11",
        }}
        onPress={press}
      >
        <TrashIcon size={DELETE_ICON_SIZE} weight="fill" color="white" />
      </XStack>
    </YStack>
  );
}

function Row({
  member,
  at,
  onDelete,
}: {
  member: MemberSummaryResponse;
  at?: string;
  onDelete?: (memberId: number) => void;
}) {
  const theme = useTheme();
  const { memberId, nickname, gender, age, receivedLikeCount, comment } =
    member;

  return (
    <RetroCard onPress={() => pushOnce(`/member/${memberId}`)}>
      <XStack gap="$3" items="center">
        <UserAvatar
          id={String(memberId)}
          url={member.profileImageUrl}
          gender={gender}
        />

        <YStack flex={1} gap="$1">
          <XStack items="center" gap="$2">
            <Text flex={1} numberOfLines={1} fontSize="$4" fontWeight="600">
              {nickname}
            </Text>

            {at && <RelativeTime at={at} />}
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

          <Text numberOfLines={1} fontSize="$3">
            {comment || EMPTY_COMMENT}
          </Text>
        </YStack>

        {onDelete && <DeleteButton onPress={() => onDelete(memberId)} />}
      </XStack>
    </RetroCard>
  );
}

export const ActivityRow = memo(Row);
