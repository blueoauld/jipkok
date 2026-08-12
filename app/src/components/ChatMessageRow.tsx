import { XStack, YStack } from "tamagui";

import { ChatBubble } from "@/components/ChatBubble";
import { ChatDay } from "@/components/ChatDay";
import { UserAvatar } from "@/components/UserAvatar";
import type { ChatMessageResponse } from "@/lib/api";
import { PRESS_OPACITY } from "@/lib/design";

const AVATAR_SIZE = 36;

const GROUP_GAP_TOP = 8;
const MESSAGE_GAP_BOTTOM = 2;

const BUBBLE_MAX_WIDTH = "88%" as const;

function displayMinute(createdAt: string) {
  return Math.floor(new Date(createdAt).getTime() / 60_000);
}

function sameGroup(a: ChatMessageResponse, b: ChatMessageResponse) {
  return (
    a.senderId === b.senderId &&
    displayMinute(a.createdAt) === displayMinute(b.createdAt)
  );
}

function sameDay(a: ChatMessageResponse, b: ChatMessageResponse) {
  return (
    new Date(a.createdAt).toDateString() ===
    new Date(b.createdAt).toDateString()
  );
}

export function ChatMessageRow({
  message,
  older,
  newer,
  mine,
  partnerId,
  partnerImageUrl,
  onPressAvatar,
  onPressPhoto,
}: {
  message: ChatMessageResponse;
  older: ChatMessageResponse | undefined;
  newer: ChatMessageResponse | undefined;
  mine: boolean;
  partnerId: number;
  partnerImageUrl: string | null;
  onPressAvatar: () => void;
  onPressPhoto: (url: string) => void;
}) {
  const grouped = !!older && sameGroup(older, message);
  const showTime = !newer || !sameGroup(newer, message);
  const showDay = !older || !sameDay(older, message);

  return (
    <>
      {showDay && <ChatDay date={new Date(message.createdAt)} />}

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
            onPressPhoto={onPressPhoto}
          />
        </XStack>
      </XStack>
    </>
  );
}
