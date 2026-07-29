import { useState } from "react";
import { FlatList } from "react-native";
import { getTokens, YStack } from "tamagui";

import { SegmentedControl } from "@/components/SegmentedControl";
import { UserRow, type User } from "@/components/UserRow";

const FILTERS = ["최근", "거리"] as const;
type Filter = (typeof FILTERS)[number];

const USERS: User[] = Array.from({ length: 100 }, (_, index) => ({
  id: String(index),
  nickname: `닉네임 ${index}`,
}));

export default function MainScreen() {
  const space = getTokens().space;
  const [filter, setFilter] = useState<Filter>("최근");

  return (
    <YStack flex={1}>
      <YStack px="$4" pt="$4" pb="$2">
        <SegmentedControl
          values={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </YStack>

      <FlatList
        data={USERS}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => <UserRow user={item} />}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          paddingTop: space.$3.val,
          paddingBottom: space.$4.val,
          paddingHorizontal: space.$4.val,
          gap: space.$4.val,
        }}
      />
    </YStack>
  );
}
