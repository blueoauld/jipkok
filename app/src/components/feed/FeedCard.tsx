import { Image } from "expo-image";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { SirenIcon } from "phosphor-react-native/src/icons/Siren";
import { memo } from "react";
import { Text, useTheme, XStack, type XStackProps, YStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { RetroPressable } from "@/components/ui/RetroPressable";
import type { FeedPostResponse } from "@/lib/api";
import { formatSlotTime } from "@/lib/date";
import { IMAGE_TRANSITION, RETRO_SHADOW_OFFSET_SM } from "@/lib/design";
import { pushOnce } from "@/lib/router";

export const CARD_RATIO = 2;

const REPORT_BUTTON_SPACE = 56;

const CARD_ICON_SIZE = 22;
const CARD_ICON_BUTTON_SIZE = 40;

function CardButton({ children, ...props }: XStackProps) {
  return (
    <RetroPressable
      offset={RETRO_SHADOW_OFFSET_SM}
      bg="$color1"
      pressBg="$color3"
      items="center"
      justify="center"
      {...props}
    >
      {children}
    </RetroPressable>
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
  const theme = useTheme();

  return (
    <RetroCard
      p={0}
      width="100%"
      aspectRatio={CARD_RATIO}
      overflow="hidden"
      bg="$color1"
      onPress={() => onPressPhoto(post.imageUrl)}
    >
      <Image
        source={post.imageUrl}
        recyclingKey={String(post.postId)}
        contentFit="cover"
        transition={IMAGE_TRANSITION}
        style={{ flex: 1 }}
      />

      <XStack position="absolute" t="$3" l="$3" r={REPORT_BUTTON_SPACE}>
        <CardButton
          bg="$yellow9"
          px="$3"
          py="$2"
          pressStyle={{
            x: RETRO_SHADOW_OFFSET_SM,
            y: RETRO_SHADOW_OFFSET_SM,
            bg: "$yellow10",
          }}
          onPress={() =>
            pushOnce(mine ? "/member/me" : `/member/${post.memberId}`)
          }
        >
          <Text
            shrink={1}
            numberOfLines={1}
            color="black"
            fontSize="$3"
            fontWeight="600"
          >
            {post.nickname}
          </Text>
        </CardButton>
      </XStack>

      <YStack position="absolute" t="$3" r="$3">
        <CardButton
          width={CARD_ICON_BUTTON_SIZE}
          height={CARD_ICON_BUTTON_SIZE}
          onPress={() => onReport(post.postId)}
        >
          <SirenIcon
            size={CARD_ICON_SIZE}
            weight="bold"
            color={theme.color12.val}
          />
        </CardButton>
      </YStack>

      <YStack position="absolute" b="$3" r="$3">
        <CardButton
          width={CARD_ICON_BUTTON_SIZE}
          height={CARD_ICON_BUTTON_SIZE}
          onPress={() => onToggleLike(post)}
        >
          <HeartIcon
            size={CARD_ICON_SIZE}
            weight={post.likedByMe ? "fill" : "bold"}
            color={post.likedByMe ? theme.red10.val : theme.color12.val}
          />
        </CardButton>
      </YStack>

      <YStack fullscreen items="center" justify="center" px="$4">
        <Text color="white" fontSize="$9" fontWeight="800">
          {formatSlotTime(post.slotAt)}
        </Text>

        {post.caption && (
          <Text numberOfLines={1} color="white" fontSize="$5" fontWeight="600">
            {post.caption}
          </Text>
        )}
      </YStack>
    </RetroCard>
  );
}

export const FeedCard = memo(Card);
