import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/activity/ActivityList";
import {
  relationListKey,
  useMemberList,
  useRemoveFromMemberList,
} from "@/hooks/useMemberList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";

const GRANTED_SECRET_PHOTOS_KEY = relationListKey("secretPhotos", "granted");

const SCREEN_OPTIONS = { title: "비밀 사진 목록" };

export default function SecretPhotoListScreen() {
  const query = useMemberList(
    GRANTED_SECRET_PHOTOS_KEY,
    api.secretPhotos.granted,
  );
  const { alertElement, showApiError } = useRetroAlert();
  const remove = useRemoveFromMemberList(
    GRANTED_SECRET_PHOTOS_KEY,
    api.secretPhotos.remove,
    showApiError,
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={SCREEN_OPTIONS} />

      <ActivityList query={query} onDelete={remove.mutate} />

      {alertElement}
    </SafeAreaView>
  );
}
