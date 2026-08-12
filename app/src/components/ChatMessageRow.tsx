import * as Haptics from "expo-haptics";
import { ArrowBendUpLeftIcon } from "phosphor-react-native/src/icons/ArrowBendUpLeft";
import { useRef } from "react";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { useTheme, XStack, YStack } from "tamagui";

import { ChatBubble } from "@/components/ChatBubble";
import { UserAvatar } from "@/components/UserAvatar";
import type { ChatMessageResponse } from "@/lib/api";
import { PRESS_OPACITY } from "@/lib/design";

const AVATAR_SIZE = 36;

const GROUP_GAP_TOP = 8;
const MESSAGE_GAP_BOTTOM = 2;

const BUBBLE_MAX_WIDTH = "88%" as const;

const REPLY_ACTION_SIZE = 32;
const REPLY_ICON_SIZE = 18;
const REPLY_FRICTION = 2;

function ReplyAction() {
  const theme = useTheme();

  return (
    <YStack self="center" px="$3">
      <XStack
        width={REPLY_ACTION_SIZE}
        height={REPLY_ACTION_SIZE}
        borderWidth={2}
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

export function ChatMessageRow({
  message,
  mine,
  grouped,
  showTime,
  replyName,
  partnerId,
  partnerImageUrl,
  onPressAvatar,
  onPressPhoto,
  onPressReply,
  onReply,
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
  onPressReply: (messageId: number) => void;
  onReply: (message: ChatMessageResponse) => void;
}) {
  const swipeable = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={REPLY_FRICTION}
      overshootRight={false}
      renderRightActions={() => <ReplyAction />}
      onSwipeableWillOpen={() => {
        swipeable.current?.close();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onReply(message);
      }}
    >
      <XStack
        px="$3"
        mt={grouped ? 0 : GROUP_GAP_TOP}
        mb={MESSAGE_GAP_BOTTOM}
        justify={mine ? "flex-end" : "flex-start"}
        gap="$2"
      >
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

        <XStack shrink={1} maxW={BUBBLE_MAX_WIDTH}>
          <ChatBubble
            message={message}
            mine={mine}
            showTime={showTime}
            replyName={replyName}
            onPressPhoto={onPressPhoto}
            onPressReply={onPressReply}
          />
        </XStack>
      </XStack>
    </ReanimatedSwipeable>
  );
}
