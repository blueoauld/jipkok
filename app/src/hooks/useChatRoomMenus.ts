import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import type { MenuSheetItem } from "@/components/MenuSheet";
import type { AlertApi } from "@/hooks/useAlert";
import { useChatRoomActions } from "@/hooks/useChatRoomActions";
import type { ChatRoomResponse } from "@/lib/api";
import { pushOnce } from "@/lib/router";

// 채팅방의 첨부 시트와 더보기 시트에 넣을 항목이다.
export function useChatRoomMenus({
  room,
  roomId,
  attach,
  alert,
}: {
  room?: ChatRoomResponse;
  roomId: number;
  attach: { album: () => void; camera: () => void; video: () => void };
  alert: AlertApi;
}) {
  const { t } = useTranslation();
  const { confirmLeave } = useChatRoomActions(alert);

  const attachItems: MenuSheetItem[] = [
    { label: t("chatRoom.attachAlbum"), onPress: attach.album },
    { label: t("chatRoom.attachCamera"), onPress: attach.camera },
    { label: t("chatRoom.attachVideo"), onPress: attach.video },
  ];

  const menuItems: MenuSheetItem[] = [
    {
      label: t("chatRoom.profile"),
      onPress: () => {
        if (room) {
          pushOnce(`/member/${room.memberId}`);
        }
      },
    },
    {
      label: t("chatMedia.title"),
      onPress: () => pushOnce(`/chat/media?roomId=${roomId}`),
    },
    {
      label: t("chatRoom.leave"),
      onPress: () => {
        if (room) {
          confirmLeave(room, () => router.back());
        }
      },
    },
    {
      label: t("action.reportSubmit"),
      destructive: true,
      onPress: () => {
        if (room) {
          pushOnce({
            pathname: "/report/[id]",
            params: {
              id: String(room.memberId),
              roomId: String(roomId),
              nickname: room.nickname,
            },
          });
        }
      },
    },
  ];

  return { attachItems, menuItems };
}
