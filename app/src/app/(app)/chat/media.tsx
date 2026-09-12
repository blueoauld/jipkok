import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTokens } from "tamagui";

import { ChatMediaTile } from "@/components/chat/ChatMediaTile";
import { VideoPlayerModal } from "@/components/chat/VideoPlayerModal";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { useChatMediaPlayback } from "@/hooks/useChatMediaPlayback";
import { useChatRoomMedia } from "@/hooks/useChatRoomMedia";
import { usePagedList } from "@/hooks/usePagedList";
import type { ChatMessageResponse } from "@/lib/api";

const COLUMNS = 3;

export default function ChatMediaScreen() {
  const { t } = useTranslation();
  const { roomId: roomIdParam } = useLocalSearchParams<{ roomId: string }>();
  const roomId = Number(roomIdParam);
  const validRoom = Number.isInteger(roomId) && roomId > 0;
  const screenOptions = useMemo(() => ({ title: t("chatMedia.title") }), [t]);

  const media = useChatRoomMedia(roomId, validRoom);
  const { messages, error, refetch } = media;
  const paged = usePagedList(media);
  const playback = useChatMediaPlayback(roomId, "media");

  const { width } = useWindowDimensions();
  const { padding, gap, tileSize } = useMemo(() => {
    const space = getTokens().space;
    const padding = space.$4.val;
    const gap = space.$2.val;

    return {
      padding,
      gap,
      tileSize: (width - padding * 2 - gap * (COLUMNS - 1)) / COLUMNS,
    };
  }, [width]);

  // 목록을 새로 받으면 URL이 새로 서명되므로 보던 사진을 messageId로 다시 찾는다.
  const viewerPhotos = useMemo(() => {
    const url = messages?.find(
      (message) => message.messageId === playback.viewerMessageId,
    )?.imageUrl;

    return url != null ? [url] : [];
  }, [messages, playback.viewerMessageId]);

  const { openViewer, playVideo } = playback;
  const handlePress = useCallback(
    (message: ChatMessageResponse) => {
      if (message.type === "VIDEO") {
        playVideo(message);
      } else if (message.imageUrl) {
        openViewer(message);
      }
    },
    [openViewer, playVideo],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {messages ? (
        <FlatList
          {...paged}
          contentContainerStyle={{ padding, gap }}
          columnWrapperStyle={{ gap }}
          numColumns={COLUMNS}
          data={messages}
          keyExtractor={(message) => String(message.messageId)}
          renderItem={({ item }) => (
            <ChatMediaTile
              message={item}
              size={tileSize}
              onPress={handlePress}
            />
          )}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <ListEmpty>{t("chatMedia.emptyMessage")}</ListEmpty>
          }
        />
      ) : (
        <ScreenState
          error={error}
          message={t("chatMedia.errorMessage")}
          onRetry={refetch}
        />
      )}

      <PhotoViewer
        photos={viewerPhotos}
        initialIndex={0}
        open={viewerPhotos.length > 0}
        onClose={playback.closeViewer}
      />

      <VideoPlayerModal
        url={playback.playingUrl}
        onClose={playback.closePlayer}
      />
    </SafeAreaView>
  );
}
