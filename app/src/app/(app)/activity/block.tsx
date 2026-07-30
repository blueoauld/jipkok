import { Stack } from "expo-router";
import { useState } from "react";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTokens, Text, YStack } from "tamagui";

import { ActivityRow, type ActivityMember } from "@/components/ActivityRow";

const MEMBERS: ActivityMember[] = Array.from({ length: 100 }, (_, index) => ({
  id: String(index),
  nickname: `닉네임 ${index}`,
}));

export default function BlockListScreen() {
  const space = getTokens().space;
  const [members, setMembers] = useState(MEMBERS);

  const remove = (id: string) =>
    setMembers((current) => current.filter((member) => member.id !== id));

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "차단 목록" }} />

      <FlatList
        data={members}
        keyExtractor={(member) => member.id}
        renderItem={({ item }) => (
          <ActivityRow member={item} onDelete={() => remove(item.id)} />
        )}
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
