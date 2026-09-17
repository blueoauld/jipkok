import type { Icon } from "phosphor-react-native";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import { Badge } from "@/components/ui/Badge";
import { Border } from "@/components/ui/Border";
import { Glass } from "@/components/ui/Glass";
import type { MemberDetailResponse } from "@/lib/api";
import { FAVORITE_COLOR } from "@/lib/color";
import {
  BADGE_SIZES,
  bottomBarHeight,
  FLOATING_BAR_RADIUS,
  floatingBarStyle,
} from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";

const ACTION_ICON_SIZE = 28;

// 배지가 아이콘 오른쪽 위 모서리에 걸치는 거리다.
const BADGE_OVERHANG = BADGE_SIZES.xsmall.height / 4;

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
    <YStack position="absolute" t={-BADGE_OVERHANG} r={-BADGE_OVERHANG}>
      <Badge size="xsmall" tone={count > 0 ? "red-fill" : "elephant-weak"}>
        {String(count)}
      </Badge>
    </YStack>
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

  const colors: Record<MemberActionKey, string> = {
    like: theme.red10.val,
    favorite: FAVORITE_COLOR,
    note: theme.blue10.val,
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
      bg="$background"
    >
      <YStack position="absolute" t={0} l={0} r={0}>
        <Border />
      </YStack>

      {items}
    </XStack>
  );
}
