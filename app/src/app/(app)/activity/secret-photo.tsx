import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList, useRemoveFromMemberList } from "@/hooks/useMemberList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";

const GRANTED_SECRET_PHOTOS_KEY = ["secretPhotos", "granted"];

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
      <Stack.Screen options={{ title: "비밀 사진 목록" }} />

      <ActivityList query={query} onDelete={remove.mutate} />

      {alertElement}
    </SafeAreaView>
  );
}
