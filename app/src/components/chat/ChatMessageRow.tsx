import * as Haptics from "expo-haptics";
import { ArrowBendUpLeftIcon } from "phosphor-react-native/src/icons/ArrowBendUpLeft";
import { memo, type ReactNode, useEffect, useRef } from "react";
import { useWindowDimensions } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme, XStack, YStack } from "tamagui";

import { ChatBubble } from "@/components/chat/ChatBubble";
import { UserAvatar } from "@/components/UserAvatar";
import type { ChatMessageResponse } from "@/lib/api";
import type { MessageFrame } from "@/lib/chat/overlay-layout";
import { PRESS_OPACITY, RETRO_BORDER_WIDTH } from "@/lib/design";

const AVATAR_SIZE = 36;

const GROUP_GAP_TOP = 8;
const MESSAGE_GAP_BOTTOM = 2;

// 안드로이드는 비율 너비로는 텍스트를 가정 너비로 먼저 재서 긴 글의 말풍선 아래가 빈다.
// 픽셀로 확정해 주면 최종 너비로 한 번에 잰다.
const BUBBLE_MAX_WIDTH_RATIO = 0.88;

const REPLY_ACTION_SIZE = 32;
const REPLY_ICON_SIZE = 18;
const REPLY_FRICTION = 2;

const DISABLE_RIGHTWARD_DRAG = Number.MAX_SAFE_INTEGER;

const BLINK_OPACITY = 0.4;
const BLINK_STEP_MILLIS = 250;

// 답장 원문으로 이동했을 때 어느 말풍선인지 알 수 있게 한 번 깜빡인다.
function Blink({ active, children }: { active: boolean; children: ReactNode }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (active) {
      opacity.value = withSequence(
        withTiming(BLINK_OPACITY, { duration: BLINK_STEP_MILLIS }),
        withTiming(1, { duration: BLINK_STEP_MILLIS }),
      );
    }
  }, [active, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // 이 래퍼가 줄어들지 않으면 긴 말풍선이 최대 너비를 넘어 시각이 화면 밖으로 밀린다.
  return (
    <Animated.View style={[{ flexShrink: 1 }, style]}>{children}</Animated.View>
  );
}

function ReplyAction() {
  const theme = useTheme();

  return (
    <YStack self="center" px="$3">
      <XStack
        width={REPLY_ACTION_SIZE}
        height={REPLY_ACTION_SIZE}
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        bg="$color1"
        items="center"
        justify="center"
      >
        <ArrowBendUpLeftIcon size={REPLY_ICON_SIZE} color={theme.color12.val} />
      </XStack>
    </YStack>
  );
}

function Row({
  message,
  mine,
  grouped,
  showTime,
  replyName,
  partnerId,
  partnerImageUrl,
  onPressAvatar,
  onPressPhoto,
  onPressVideo,
  onPressReply,
  onOpenActions,
  onReply,
  myMemberId,
  highlighted,
}: {
  message: ChatMessageResponse;
  mine: boolean;
  grouped: boolean;
  showTime: boolean;
  replyName: string;
  partnerId: number;
  partnerImageUrl: string | null;
  onPressAvatar: () => void;
  onPressPhoto: (url: string) => void;
  onPressVideo: (message: ChatMessageResponse) => void;
  onPressReply: (messageId: number) => void;
  onOpenActions: (message: ChatMessageResponse, frame: MessageFrame) => void;
  onReply: (message: ChatMessageResponse) => void;
  myMemberId: number;
  highlighted: boolean;
}) {
  const swipeable = useRef<SwipeableMethods>(null);
  const { width } = useWindowDimensions();
  const bubbleMaxWidth = Math.floor(width * BUBBLE_MAX_WIDTH_RATIO);

  return (
    <YStack mt={grouped ? 0 : GROUP_GAP_TOP} mb={MESSAGE_GAP_BOTTOM}>
      <ReanimatedSwipeable
        ref={swipeable}
        friction={REPLY_FRICTION}
        overshootRight={false}
        dragOffsetFromLeftEdge={DISABLE_RIGHTWARD_DRAG}
        renderRightActions={() => <ReplyAction />}
        onSwipeableWillOpen={() => {
          swipeable.current?.close();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onReply(message);
        }}
      >
        <XStack px="$3" justify={mine ? "flex-end" : "flex-start"} gap="$2">
          {!mine &&
            (grouped ? (
              <YStack width={AVATAR_SIZE} />
            ) : (
              <YStack
                pressStyle={{ opacity: PRESS_OPACITY }}
                onPress={onPressAvatar}
              >
                <UserAvatar
                  id={String(partnerId)}
                  url={partnerImageUrl}
                  size={AVATAR_SIZE}
                />
              </YStack>
            ))}

          <XStack shrink={1} maxW={bubbleMaxWidth}>
            <Blink active={highlighted}>
              <ChatBubble
                message={message}
                mine={mine}
                showTime={showTime}
                replyName={replyName}
                myMemberId={myMemberId}
                onPressPhoto={onPressPhoto}
                onPressVideo={onPressVideo}
                onPressReply={onPressReply}
                onOpenActions={onOpenActions}
              />
            </Blink>
          </XStack>
        </XStack>
      </ReanimatedSwipeable>
    </YStack>
  );
}

export const ChatMessageRow = memo(Row);
