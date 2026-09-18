import type { Icon } from "phosphor-react-native";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import { Border } from "@/components/ui/Border";
import { Glass } from "@/components/ui/Glass";
import { Text } from "@/components/ui/Text";
import type { MemberDetailResponse } from "@/lib/api";
import {
  bottomBarHeight,
  DARK_FILL,
  DISABLED_OPACITY,
  FLOATING_BAR_RADIUS,
  FLOATING_BAR_STYLE,
  PILL_RADIUS,
} from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";

const ACTION_ICON_SIZE = 28;

// 비밀사진 개수 원은 TDS 배지 크기보다 원은 작고 숫자는 크게 따로 잡았다. 한 자리는 원, 두 자리부터 알약이다.
const COUNT_BADGE_SIZE = 20;
const COUNT_BADGE_PADDING_X = 5;
const COUNT_BADGE_FONT_SIZE = 12;

// 배지가 아이콘 오른쪽 위 모서리에 걸치는 거리다.
const BADGE_OVERHANG = COUNT_BADGE_SIZE / 4;

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
      t={-BADGE_OVERHANG}
      r={-BADGE_OVERHANG}
      minW={COUNT_BADGE_SIZE}
      height={COUNT_BADGE_SIZE}
      px={COUNT_BADGE_PADDING_X}
      rounded={PILL_RADIUS}
      bg={count > 0 ? "$red500" : DARK_FILL}
      items="center"
      justify="center"
    >
      <Text color="$onFill" fontSize={COUNT_BADGE_FONT_SIZE} fontWeight="700">
        {String(count)}
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

  const colors: Record<MemberActionKey, string> = {
    like: theme.red500.val,
    favorite: theme.yellow500.val,
    note: theme.blue500.val,
    secretPhoto: theme.green500.val,
    block: theme.red500.val,
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
      opacity={pending === key || disabled[key] ? DISABLED_OPACITY : 1}
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        key === "secretPhoto"
          ? `${t("a11y.secretPhoto")} ${member.secretPhotoCount}`
          : t(`a11y.${key}`)
      }
      accessibilityState={{ selected: filled[key], disabled: disabled[key] }}
      onPress={disabled[key] ? undefined : () => onPress(key)}
    >
      <YStack>
        <Icon
          size={ACTION_ICON_SIZE}
          weight={filled[key] && key !== "block" ? "fill" : "regular"}
          color={filled[key] ? colors[key] : theme.grey900.val}
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
          ...FLOATING_BAR_STYLE,
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
