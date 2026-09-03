import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { forgetRoom } from "@/hooks/useChatSocket";
import { api, type ChatMessageResponse } from "@/lib/api";
import { isPending, isRoomNotFound } from "@/lib/chat";
import i18n from "@/lib/i18n";
import { showToast } from "@/lib/toast/store";

const VIDEO_URL_FAILED_MESSAGE = i18n.t("hook.videoUrlFailed");

export function useChatMediaPlayback(roomId: number) {
  const queryClient = useQueryClient();
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

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
    viewerUrl,
    openViewer: setViewerUrl,
    closeViewer: () => setViewerUrl(null),
    playingUrl,
    playVideo,
    closePlayer: () => setPlayingUrl(null),
  };
}
