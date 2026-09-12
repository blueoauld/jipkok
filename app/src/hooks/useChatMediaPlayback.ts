import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatMediaKey } from "@/hooks/useChatRoomMedia";
import { forgetRoom } from "@/hooks/useChatSocket";
import { api, type ChatMessageResponse } from "@/lib/api";
import { isPending, isRoomNotFound } from "@/lib/chat";
import i18n from "@/lib/i18n";
import { showToast } from "@/lib/toast/store";

const VIDEO_URL_FAILED_MESSAGE = i18n.t("hook.videoUrlFailed");

// 뷰어가 넘겨 보는 목록이 화면마다 다르므로 어느 쪽을 새로 받을지 받아 둔다.
type MediaSource = "messages" | "media";

export function useChatMediaPlayback(roomId: number, source: MediaSource) {
  const queryClient = useQueryClient();
  const [viewerMessageId, setViewerMessageId] = useState<number | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  // 만료된 것은 한 장이 아니라 목록에 실린 URL 전부다. 장마다 다시 받는 대신 목록을 새로
  // 받아 한 요청으로 모두 새로 서명한다. 자리는 messageId로 잡으므로 그 사이 목록이
  // 갈려도 보던 사진에 그대로 머문다.
  const openViewer = useCallback(
    (message: ChatMessageResponse) => {
      setViewerMessageId(message.messageId);
      queryClient.invalidateQueries({
        queryKey:
          source === "media" ? chatMediaKey(roomId) : chatMessagesKey(roomId),
      });
    },
    [queryClient, roomId, source],
  );

  // 서명 URL은 10분이면 만료되므로 재생 직전에 새로 받는다. 아직 안 보낸 건 로컬 파일이다.
  const playVideo = useCallback(
    async (message: ChatMessageResponse) => {
      if (isPending(message)) {
        setPlayingUrl(message.videoUrl ?? null);
        return;
      }

      try {
        const { url } = await api.chats.videoUrl(roomId, message.messageId);
        setPlayingUrl(url);
      } catch (error) {
        if (isRoomNotFound(error)) {
          forgetRoom(queryClient, roomId);
        } else {
          showToast("error", VIDEO_URL_FAILED_MESSAGE);
        }
      }
    },
    [queryClient, roomId],
  );

  return {
    viewerMessageId,
    openViewer,
    closeViewer: () => setViewerMessageId(null),
    playingUrl,
    playVideo,
    closePlayer: () => setPlayingUrl(null),
  };
}
