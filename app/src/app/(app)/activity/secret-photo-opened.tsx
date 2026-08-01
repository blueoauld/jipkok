import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const RECEIVED_SECRET_PHOTOS_KEY = ["secretPhotos", "received"];

export default function OpenedSecretPhotoListScreen() {
  const query = useMemberList(
    RECEIVED_SECRET_PHOTOS_KEY,
    api.secretPhotos.received,
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "공개된 비밀 사진 목록" }} />

      <ActivityList query={query} />
    </SafeAreaView>
  );
}
