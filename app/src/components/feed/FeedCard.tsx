import { Image } from "expo-image";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { SirenIcon } from "phosphor-react-native/src/icons/Siren";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Text as NativeText } from "react-native";
import { Text, useTheme, XStack, type XStackProps, YStack } from "tamagui";

import { Card } from "@/components/ui/Card";
import { Glass } from "@/components/ui/Glass";
import type { FeedPostResponse } from "@/lib/api";
import { formatSlotTime } from "@/lib/date";
import {
  COVER_IMAGE_STYLE,
  IMAGE_TRANSITION,
  MIN_TAP_SIZE,
  OVERLAY_BG,
  OVERLAY_INK,
  PILL_RADIUS,
  PRESS_OPACITY,
} from "@/lib/design";
import { GLASS_ENABLED, usePhotoGlass } from "@/lib/glass";
import { pushOnce } from "@/lib/router";

export const CARD_RATIO = 2;

const CARD_ICON_SIZE = 22;
const CARD_ICON_BUTTON_SIZE = MIN_TAP_SIZE;
const CHIP_PADDING_X = 14;

// 신고 버튼이 차지하는 자리다. 닉네임이 그 아래로 물리지 않게 비운다.
const REPORT_BUTTON_SPACE = CARD_ICON_BUTTON_SIZE + 16;

// 사진 위 글자가 밝은 사진에서도 읽히도록 번지는 그림자를 깐다.
const TEXT_SHADOW = {
  textShadowColor: "rgba(0, 0, 0, 0.4)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 8,
} as const;

const SLOT_STYLE = {
  fontSize: 30,
  fontWeight: "800",
  color: OVERLAY_INK,
  ...TEXT_SHADOW,
} as const;

// 사진 위 버튼은 iOS 26에서 유리로 띄운다. 그 밖에서는 반투명한 검정 원이다.
// chip은 닉네임처럼 글이 들어가 폭이 내용을 따라가는 알약이고, 아니면 아이콘 하나짜리 원이다.
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
            paddingHorizontal: chip ? CHIP_PADDING_X : 0,
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
      minH={CARD_ICON_BUTTON_SIZE}
      width={chip ? undefined : CARD_ICON_BUTTON_SIZE}
      px={chip ? CHIP_PADDING_X : 0}
      rounded={PILL_RADIUS}
      bg={OVERLAY_BG}
      items="center"
      justify="center"
      pressStyle={{ opacity: PRESS_OPACITY }}
      {...props}
    >
      {children}
    </XStack>
  );
}

function Item({
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
  const ink = GLASS_ENABLED ? photoGlass.ink : OVERLAY_INK;

  return (
    <Card
      p={0}
      width="100%"
      aspectRatio={CARD_RATIO}
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
            color={ink}
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
            <SirenIcon size={CARD_ICON_SIZE} weight="bold" color={ink} />
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
            color={post.likedByMe ? theme.red500.val : ink}
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
            fontSize="$4"
            fontWeight="600"
            {...TEXT_SHADOW}
          >
            {post.caption}
          </Text>
        )}
      </YStack>
    </Card>
  );
}

export const FeedCard = memo(Item);
