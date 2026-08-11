import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatRoomKey, useChatRoom } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";
import { pushOnce } from "@/lib/router";

const LEAVE_DESCRIPTION =
  "나가면 주고받은 대화 내역이 서로에게서 모두 사라집니다.";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);

  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const { alertElement, confirm, showApiError } = useRetroAlert();

  const { data: room } = useChatRoom(roomId, true);

  const leave = useMutation({
    mutationFn: () => api.chats.leave(roomId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: chatRoomKey(roomId) });
      queryClient.removeQueries({ queryKey: chatMessagesKey(roomId) });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      router.back();
    },
    onError: showApiError,
  });

  const openMenu = useCallback(() => setMenuOpen(true), []);

  const screenOptions = useMemo(
    () => ({
      title: room?.nickname ?? "",
      headerRight: () => (
        <HeaderCircleIconButton
          icon={DotsThreeIcon}
          weight="bold"
          onPress={openMenu}
        />
      ),
    }),
    [room?.nickname, openMenu],
  );

  const menuItems: MenuSheetItem[] = [
    {
      label: "프로필",
      onPress: () => {
        if (room) {
          pushOnce(`/member/${room.memberId}`);
        }
      },
    },
    {
      label: "나가기",
      onPress: () =>
        confirm({
          message: LEAVE_DESCRIPTION,
          confirmLabel: "나가기",
          destructive: true,
          onConfirm: () => leave.mutate(),
        }),
    },
    {
      label: "신고하기",
      destructive: true,
      onPress: () => {
        if (room) {
          pushOnce(`/report/${room.memberId}?roomId=${roomId}`);
        }
      },
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {room ? (
        <YStack flex={1} />
      ) : (
        <YStack flex={1} justify="center" items="center">
          <Spinner size="small" />
        </YStack>
      )}

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />

      {alertElement}
    </SafeAreaView>
  );
}
