import { memo, useRef } from "react";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { XStack, YStack } from "tamagui";

import { ChatBubble, displayMinute } from "@/components/ChatBubble";
import { ChatDay } from "@/components/ChatDay";
import { ChatSwipeReplyAction } from "@/components/ChatSwipeReplyAction";
import { UserAvatar } from "@/components/UserAvatar";
import type { ChatMessageResponse, ReplyMessageResponse } from "@/lib/api";
import { PRESS_OPACITY } from "@/lib/design";

const AVATAR_SIZE = 36;

// 아래 간격을 2로 통일해야 스와이프 답장 아이콘이 버블 중앙에 온다.
const MESSAGE_GAP_BOTTOM = 2;
const GROUP_GAP_TOP = 8;

// 기본 70%면 아바타 + 사진 200 + 시간이 안 들어가서 시간이 사진을 덮는다.
const BUBBLE_MAX_WIDTH = "88%" as const;

function sameGroup(a: ChatMessageResponse, b: ChatMessageResponse) {
  return (
    a.senderId === b.senderId &&
    displayMinute(a.createdAt) === displayMinute(b.createdAt)
  );
}

function sameDay(a: ChatMessageResponse, b: ChatMessageResponse) {
  return (
    new Date(a.createdAt).toDateString() === new Date(b.createdAt).toDateString()
  );
}

function Row({
  message,
  older,
  newer,
  mine,
  replyName,
  partnerAvatarUrl,
  partnerId,
  onPressAvatar,
  onPressPhoto,
  onPressReply,
  onSwipeReply,
}: {
  message: ChatMessageResponse;
  older: ChatMessageResponse | undefined;
  newer: ChatMessageResponse | undefined;
  mine: boolean;
  replyName: string;
  partnerAvatarUrl: string | null;
  partnerId: number;
  onPressAvatar: () => void;
  onPressPhoto: (url: string) => void;
  onPressReply: (reply: ReplyMessageResponse) => void;
  onSwipeReply: (message: ChatMessageResponse) => void;
}) {
  const swipeable = useRef<SwipeableMethods>(null);

  const grouped = !!older && sameGroup(older, message);
  const showTime = !newer || !sameGroup(newer, message);
  const showDay = !older || !sameDay(older, message);

  return (
    <>
      {showDay && <ChatDay date={new Date(message.createdAt)} />}

      <ReanimatedSwipeable
        ref={swipeable}
        friction={2}
        overshootLeft={false}
        renderLeftActions={() => <ChatSwipeReplyAction />}
        onSwipeableWillOpen={() => {
          swipeable.current?.close();
          onSwipeReply(message);
        }}
      >
        <XStack
          px="$2"
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
                  url={partnerAvatarUrl}
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
    </>
  );
}

// 타이핑 같은 화면 상태 변화에 행 전체가 다시 그려지지 않게 memo로 감싼다.
// 콜백은 부모에서 useCallback으로 고정해 행 데이터가 그대로면 건너뛴다.
export const ChatMessageRow = memo(Row);
