import type { Icon } from "phosphor-react-native";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { Glass } from "@/components/ui/Glass";
import type { MemberDetailResponse } from "@/lib/api";
import { FAVORITE_COLOR } from "@/lib/color";
import {
  bottomBarHeight,
  FLOATING_BAR_RADIUS,
  floatingBarStyle,
  RETRO_BORDER_WIDTH,
} from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";
import { useAccentColor } from "@/lib/theme/accent";

const ACTION_ICON_SIZE = 30;

const BADGE_SIZE = 18;
const BADGE_FONT_SIZE = 11;
const BADGE_OPACITY = 0.9;

export type MemberActionKey =
  "like" | "favorite" | "note" | "secretPhoto" | "block";

const ACTIONS: { key: MemberActionKey; icon: Icon }[] = [
  { key: "like", icon: HeartIcon },
  { key: "favorite", icon: StarIcon },
  { key: "note", icon: ChatCircleIcon },
  { key: "secretPhoto", icon: ImageIcon },
  { key: "block", icon: ProhibitIcon },
];

function CountBadge({ count }: { count: number }) {
  return (
    <XStack
      position="absolute"
      t={-BADGE_SIZE / 4}
      r={-BADGE_SIZE / 4}
      width={BADGE_SIZE}
      height={BADGE_SIZE}
      rounded={9999}
      bg={count > 0 ? "$red10" : "$gray10"}
      opacity={BADGE_OPACITY}
      items="center"
      justify="center"
    >
      <Text color="white" fontSize={BADGE_FONT_SIZE} fontWeight="700">
        {count}
      </Text>
    </XStack>
  );
}

export function MemberActionBar({
  member,
  pending,
  onPress,
}: {
  member: MemberDetailResponse;
  pending: MemberActionKey | null;
  onPress: (key: MemberActionKey) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const filled: Record<MemberActionKey, boolean> = {
    like: member.likedByMe,
    favorite: member.favoritedByMe,
    note: member.noteReceiveEnabled,
    secretPhoto: member.secretPhotoGrantedToMe,
    block: member.blockedByMe,
  };
  const accent = useAccentColor();

  const colors: Record<MemberActionKey, string> = {
    like: theme.red10.val,
    favorite: FAVORITE_COLOR,
    note: accent,
    secretPhoto: theme.green10.val,
    block: theme.red10.val,
  };

  const disabled: Record<MemberActionKey, boolean> = {
    like: false,
    favorite: false,
    note: !member.noteReceiveEnabled || member.blockedByMe,
    // 서버가 차단 관계면 비밀사진을 거절하므로 쪽지처럼 미리 막는다.
    secretPhoto: member.blockedByMe,
    block: false,
  };

  const items = ACTIONS.map(({ key, icon: Icon }) => (
    <XStack
      key={key}
      flex={1}
      height="100%"
      items="center"
      justify="center"
      opacity={pending === key || disabled[key] ? 0.4 : 1}
      accessibilityRole="button"
      accessibilityLabel={t(`a11y.${key}`)}
      accessibilityState={{ selected: filled[key], disabled: disabled[key] }}
      onPress={disabled[key] ? undefined : () => onPress(key)}
    >
      <YStack>
        <Icon
          size={ACTION_ICON_SIZE}
          weight={filled[key] && key !== "block" ? "fill" : "regular"}
          color={filled[key] ? colors[key] : theme.color12.val}
        />

        {key === "secretPhoto" && (
          <CountBadge count={member.secretPhotoCount} />
        )}
      </YStack>
    </XStack>
  ));

  if (GLASS_ENABLED) {
    return (
      <Glass
        style={{
          ...floatingBarStyle(insets.bottom),
          borderRadius: FLOATING_BAR_RADIUS,
          flexDirection: "row",
        }}
      >
        {items}
      </Glass>
    );
  }

  return (
    <XStack
      position="absolute"
      b={0}
      l={0}
      r={0}
      height={bottomBarHeight(insets.bottom)}
      pb={insets.bottom}
      bg="$color1"
      borderTopWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
    >
      {items}
    </XStack>
  );
}
