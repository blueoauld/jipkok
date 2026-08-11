import * as Haptics from "expo-haptics";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { UserAvatar } from "@/components/UserAvatar";
import type { MemberSummaryResponse } from "@/lib/api";
import { RETRO_SHADOW_OFFSET_SM } from "@/lib/design";
import { genderLabel } from "@/lib/member";

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
      <YStack
        position="absolute"
        t={RETRO_SHADOW_OFFSET_SM}
        b={-RETRO_SHADOW_OFFSET_SM}
        l={RETRO_SHADOW_OFFSET_SM}
        r={-RETRO_SHADOW_OFFSET_SM}
        bg="$gray12"
      />
      <XStack
        width={DELETE_BUTTON_SIZE}
        height={DELETE_BUTTON_SIZE}
        borderWidth={2}
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

export function ActivityRow({
  member,
  caption,
  onPress,
  onDelete,
}: {
  member: MemberSummaryResponse;
  caption?: string;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const theme = useTheme();
  const { memberId, nickname, gender, age, receivedLikeCount, comment } =
    member;

  return (
    <RetroCard onPress={onPress}>
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

            {caption && (
              <Text shrink={0} fontSize="$2">
                {caption}
              </Text>
            )}
          </XStack>

          <XStack items="center">
            <Text fontSize="$3">
              {`${genderLabel(gender)} · ${age}살 · `}
            </Text>

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

        {onDelete && <DeleteButton onPress={onDelete} />}
      </XStack>
    </RetroCard>
  );
}
