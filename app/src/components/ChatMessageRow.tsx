import { XStack, YStack } from "tamagui";

import { ChatBubble } from "@/components/ChatBubble";
import { UserAvatar } from "@/components/UserAvatar";
import type { ChatMessageResponse } from "@/lib/api";
import { PRESS_OPACITY } from "@/lib/design";

const AVATAR_SIZE = 36;

const GROUP_GAP_TOP = 8;
const MESSAGE_GAP_BOTTOM = 2;

const BUBBLE_MAX_WIDTH = "88%" as const;

export function ChatMessageRow({
  message,
  mine,
  grouped,
  showTime,
  partnerId,
  partnerImageUrl,
  onPressAvatar,
  onPressPhoto,
}: {
  message: ChatMessageResponse;
  mine: boolean;
  grouped: boolean;
  showTime: boolean;
  partnerId: number;
  partnerImageUrl: string | null;
  onPressAvatar: () => void;
  onPressPhoto: (url: string) => void;
}) {
  return (
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
          <YStack pressStyle={{ opacity: PRESS_OPACITY }} onPress={onPressAvatar}>
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
  );
}
