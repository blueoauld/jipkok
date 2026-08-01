import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList, useRemoveFromMemberList } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const GRANTED_SECRET_PHOTOS_KEY = ["secretPhotos", "granted"];

export default function SecretPhotoListScreen() {
  const query = useMemberList(
    GRANTED_SECRET_PHOTOS_KEY,
    api.secretPhotos.granted,
  );
  const remove = useRemoveFromMemberList(
    GRANTED_SECRET_PHOTOS_KEY,
    api.secretPhotos.remove,
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "비밀 사진 목록" }} />

      <ActivityList
        query={query}
        onDelete={(member) => remove.mutate(member.memberId)}
      />
    </SafeAreaView>
  );
}
