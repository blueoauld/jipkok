import * as Haptics from "expo-haptics";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { UserAvatar } from "@/components/UserAvatar";
import type { MemberSummaryResponse } from "@/lib/api";
import { PRESS_OPACITY } from "@/lib/design";
import { genderLabel } from "@/lib/member";

const EMPTY_COMMENT = "-";
const LIKE_ICON_SIZE = 13;

const DELETE_BUTTON_SIZE = 48;
const DELETE_ICON_SIZE = 24;

function DeleteButton({ onPress }: { onPress: () => void }) {
  const press = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <XStack
      shrink={0}
      width={DELETE_BUTTON_SIZE}
      height={DELETE_BUTTON_SIZE}
      rounded={9999}
      bg="$red10"
      items="center"
      justify="center"
      pressStyle={{ opacity: PRESS_OPACITY }}
      onPress={press}
    >
      <TrashIcon size={DELETE_ICON_SIZE} weight="fill" color="white" />
    </XStack>
  );
}

export function ActivityRow({
  member,
  onPress,
  onDelete,
}: {
  member: MemberSummaryResponse;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const theme = useTheme();
  const { memberId, nickname, gender, age, receivedLikeCount, comment } =
    member;

  return (
    <XStack gap="$3" items="center">
      <XStack
        flex={1}
        gap="$3"
        items="center"
        pressStyle={onPress && { opacity: PRESS_OPACITY }}
        onPress={onPress}
      >
        <UserAvatar id={String(memberId)} url={member.profileImageUrl} />

        <YStack flex={1} gap="$1">
          <Text numberOfLines={1} fontSize="$4" fontWeight="600">
            {nickname}
          </Text>

          <XStack items="center">
            <Text theme="gray" color="$color10" fontSize="$3">
              {`${genderLabel(gender)} · ${age}살 · `}
            </Text>

            <XStack items="center" gap="$1">
              <HeartIcon
                size={LIKE_ICON_SIZE}
                weight="fill"
                color={theme.gray10.val}
              />

              <Text theme="gray" color="$color10" fontSize="$3">
                {receivedLikeCount}
              </Text>
            </XStack>
          </XStack>

          <Text numberOfLines={1} theme="gray" color="$color10" fontSize="$3">
            {comment || EMPTY_COMMENT}
          </Text>
        </YStack>
      </XStack>

      {onDelete && <DeleteButton onPress={onDelete} />}
    </XStack>
  );
}
