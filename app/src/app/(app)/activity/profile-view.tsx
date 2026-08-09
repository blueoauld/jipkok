import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useProfileViews } from "@/hooks/useProfileViews";

export default function ProfileViewListScreen() {
  const query = useProfileViews();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "내 프로필 조회 목록" }} />

      <ActivityList query={query} />
    </SafeAreaView>
  );
}
