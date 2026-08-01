import { Stack } from "expo-router";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTokens, Text, YStack } from "tamagui";

import { ActivityRow } from "@/components/ActivityRow";
import type { MemberSummaryResponse } from "@/lib/api";

const MEMBERS: MemberSummaryResponse[] = Array.from(
  { length: 100 },
  (_, index) => ({
    memberId: index,
    nickname: `닉네임 ${index}`,
    gender: "MALE",
    age: 20,
    receivedLikeCount: 100,
    comment: "코멘트",
    profileImageUrl: null,
  }),
);

export default function ReceivedFavoriteListScreen() {
  const space = getTokens().space;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "받은 즐겨찾기 목록" }} />

      <FlatList
        data={MEMBERS}
        keyExtractor={(member) => String(member.memberId)}
        renderItem={({ item }) => <ActivityRow member={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: space.$4.val,
          gap: space.$4.val,
        }}
        ListEmptyComponent={
          <YStack items="center" py="$8">
            <Text theme="gray" color="$color10">
              목록이 비어있습니다.
            </Text>
          </YStack>
        }
      />
    </SafeAreaView>
  );
}
