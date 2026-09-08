import { Image } from "expo-image";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { SirenIcon } from "phosphor-react-native/src/icons/Siren";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Text as NativeText } from "react-native";
import { Text, useTheme, XStack, type XStackProps, YStack } from "tamagui";

import { Glass } from "@/components/ui/Glass";
import { RetroCard } from "@/components/ui/RetroCard";
import type { FeedPostResponse } from "@/lib/api";
import { formatSlotTime } from "@/lib/date";
import {
  COVER_IMAGE_STYLE,
  IMAGE_TRANSITION,
  MIN_TAP_SIZE,
  OVERLAY_INK,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET_SM,
} from "@/lib/design";
import { GLASS_ENABLED, usePhotoGlass } from "@/lib/glass";
import { pushOnce } from "@/lib/router";

export const CARD_RATIO = 2;

const CARD_ICON_SIZE = 22;
const CARD_ICON_BUTTON_SIZE = MIN_TAP_SIZE;
const GLASS_CHIP_PADDING = 14;

// 신고 버튼이 차지하는 자리다. 닉네임이 그 아래로 물리지 않게 비운다.
const REPORT_BUTTON_SPACE = CARD_ICON_BUTTON_SIZE + 16;

const HARD_SHADOW = {
  width: RETRO_SHADOW_OFFSET_SM,
  height: RETRO_SHADOW_OFFSET_SM,
};

const HARD_SHADOW_RADIUS = Platform.select({ ios: 0, default: 1 });

const SLOT_FONT = Platform.select({
  ios: { fontFamily: "Menlo", fontWeight: "800" },
  default: { fontFamily: "monospace", fontWeight: "bold" },
} as const);

const SLOT_STYLE = {
  ...SLOT_FONT,
  fontSize: 30,
  letterSpacing: 1,
  color: OVERLAY_INK,
  textShadowColor: "black",
  textShadowOffset: HARD_SHADOW,
  textShadowRadius: HARD_SHADOW_RADIUS,
} as const;

// 사진 위 버튼은 iOS 26에서 유리로 띄운다. 그 밖에서는 그림자 없는 레트로 상자다.
// chip은 닉네임처럼 글이 들어가 폭이 내용을 따라가고, 아니면 아이콘 하나짜리 정사각형이다.
function CardButton({
  chip = false,
  children,
  ...props
}: XStackProps & { chip?: boolean }) {
  const photoGlass = usePhotoGlass();

  if (GLASS_ENABLED) {
    return (
      <XStack pressStyle={{ opacity: PRESS_OPACITY }} {...props}>
        <Glass
          style={{
            height: CARD_ICON_BUTTON_SIZE,
            width: chip ? undefined : CARD_ICON_BUTTON_SIZE,
            borderRadius: CARD_ICON_BUTTON_SIZE / 2,
            paddingHorizontal: chip ? GLASS_CHIP_PADDING : 0,
            alignItems: "center",
            justifyContent: "center",
          }}
          tintColor={photoGlass.tint}
          isInteractive
        >
          {children}
        </Glass>
      </XStack>
    );
  }

  return (
    <XStack
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      bg={chip ? "$yellow9" : "$color1"}
      px={chip ? "$3" : 0}
      py={chip ? "$2" : 0}
      minH={CARD_ICON_BUTTON_SIZE}
      width={chip ? undefined : CARD_ICON_BUTTON_SIZE}
      items="center"
      justify="center"
      pressStyle={{ bg: chip ? "$yellow10" : "$color3" }}
      {...props}
    >
      {children}
    </XStack>
  );
}

function Card({
  post,
  mine,
  onPressPhoto,
  onReport,
  onToggleLike,
}: {
  post: FeedPostResponse;
  mine: boolean;
  onPressPhoto: (imageUrl: string) => void;
  onReport: (postId: number) => void;
  onToggleLike: (post: FeedPostResponse) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const photoGlass = usePhotoGlass();
  const iconInk = GLASS_ENABLED ? photoGlass.ink : theme.color12.val;

  return (
    <RetroCard
      p={0}
      width="100%"
      aspectRatio={CARD_RATIO}
      overflow="hidden"
      bg="$gray12"
      pressBg="$gray12"
      onPress={() => onPressPhoto(post.imageUrl)}
    >
      <Image
        source={post.imageUrl}
        recyclingKey={String(post.postId)}
        contentFit="cover"
        transition={IMAGE_TRANSITION}
        style={COVER_IMAGE_STYLE}
      />

      <XStack position="absolute" t="$3" l="$3" r={REPORT_BUTTON_SPACE}>
        <CardButton
          chip
          shrink={1}
          onPress={() =>
            pushOnce(mine ? "/member/me" : `/member/${post.memberId}`)
          }
        >
          <Text
            shrink={1}
            numberOfLines={1}
            color={GLASS_ENABLED ? photoGlass.ink : "black"}
            fontSize="$4"
            fontWeight="600"
          >
            {post.nickname}
          </Text>
        </CardButton>
      </XStack>

      {!mine && (
        <YStack position="absolute" t="$3" r="$3">
          <CardButton
            accessibilityRole="button"
            accessibilityLabel={t("a11y.report")}
            onPress={() => onReport(post.postId)}
          >
            <SirenIcon size={CARD_ICON_SIZE} weight="bold" color={iconInk} />
          </CardButton>
        </YStack>
      )}

      <YStack position="absolute" b="$3" l="$3">
        <CardButton
          accessibilityRole="button"
          accessibilityLabel={t("a11y.like")}
          accessibilityState={{ selected: post.likedByMe }}
          onPress={() => onToggleLike(post)}
        >
          <HeartIcon
            size={CARD_ICON_SIZE}
            weight={post.likedByMe ? "fill" : "bold"}
            color={post.likedByMe ? theme.red10.val : iconInk}
          />
        </CardButton>
      </YStack>

      <YStack fullscreen items="center" justify="center" px="$4" gap="$1">
        <NativeText style={SLOT_STYLE}>
          {formatSlotTime(post.slotAt)}
        </NativeText>

        {post.caption && (
          <Text
            numberOfLines={1}
            color={OVERLAY_INK}
            fontSize="$5"
            fontWeight="600"
            textShadowColor="black"
            textShadowOffset={HARD_SHADOW}
            textShadowRadius={HARD_SHADOW_RADIUS}
          >
            {post.caption}
          </Text>
        )}
      </YStack>
    </RetroCard>
  );
}

export const FeedCard = memo(Card);
