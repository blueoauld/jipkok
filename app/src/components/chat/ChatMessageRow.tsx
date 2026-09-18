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
import { BUBBLE_TAIL_OVERHANG } from "@/components/chat/ChatBubbleFrame";
import { Text } from "@/components/ui/Text";
import { UserAvatar } from "@/components/UserAvatar";
import type { ChatMessageResponse } from "@/lib/api";
import { isPending } from "@/lib/chat";
import type { MessageFrame } from "@/lib/chat/overlay-layout";
import { PILL_RADIUS, PRESS_OPACITY, SCREEN_PADDING } from "@/lib/design";

const AVATAR_SIZE = 40;
// 묶음의 첫 말풍선 꼬리가 사진 쪽으로 나오므로 그만큼 더 띄운다.
const AVATAR_GAP = BUBBLE_TAIL_OVERHANG + 8;
const NAME_GAP = 4;

const GROUP_GAP_TOP = 12;
export const MESSAGE_GAP_BOTTOM = 4;

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
        rounded={PILL_RADIUS}
        bg="$grey100"
        items="center"
        justify="center"
      >
        <ArrowBendUpLeftIcon size={REPLY_ICON_SIZE} color={theme.grey700.val} />
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
  partnerName,
  partnerImageUrl,
  onPressAvatar,
  onPressPhoto,
  onPressVideo,
  onPressQuote,
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
  partnerName: string;
  partnerImageUrl: string | null;
  onPressAvatar: () => void;
  onPressPhoto: (message: ChatMessageResponse) => void;
  onPressVideo: (message: ChatMessageResponse) => void;
  onPressQuote: (messageId: number) => void;
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
        enabled={!isPending(message)}
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
        <XStack
          px={SCREEN_PADDING}
          justify={mine ? "flex-end" : "flex-start"}
          gap={AVATAR_GAP}
        >
          {!mine &&
            (grouped ? (
              <YStack width={AVATAR_SIZE} />
            ) : (
              <YStack
                pressStyle={{ opacity: PRESS_OPACITY }}
                accessible
                accessibilityRole="button"
                accessibilityLabel={partnerName}
                onPress={onPressAvatar}
              >
                <UserAvatar
                  id={String(partnerId)}
                  url={partnerImageUrl}
                  size={AVATAR_SIZE}
                />
              </YStack>
            ))}

          {/* 상대 묶음의 첫 말풍선은 사진 옆 이름 줄 아래에서 시작한다. */}
          <YStack shrink={1} gap={NAME_GAP}>
            {!mine && !grouped && (
              <Text preset="note" numberOfLines={1} color="$grey700">
                {partnerName}
              </Text>
            )}

            <XStack shrink={1} maxW={bubbleMaxWidth}>
              <Blink active={highlighted}>
                <ChatBubble
                  message={message}
                  mine={mine}
                  tail={!grouped}
                  showTime={showTime}
                  replyName={replyName}
                  myMemberId={myMemberId}
                  onPressPhoto={onPressPhoto}
                  onPressVideo={onPressVideo}
                  onPressQuote={onPressQuote}
                  onOpenActions={onOpenActions}
                />
              </Blink>
            </XStack>
          </YStack>
        </XStack>
      </ReanimatedSwipeable>
    </YStack>
  );
}

export const ChatMessageRow = memo(Row);
