import { Stack } from "expo-router";
import { useState } from "react";
import { FlatList } from "react-native";
import { getTokens, Text, YStack } from "tamagui";

import { FormInput } from "@/components/FormInput";
import { UserRow, type User } from "@/components/UserRow";
import { SafeAreaView } from "react-native-safe-area-context";

const USERS: User[] = Array.from({ length: 100 }, (_, index) => ({
  id: String(index),
  nickname: `닉네임 ${index}`,
}));

export default function MemberSearchScreen() {
  const space = getTokens().space;
  const [query, setQuery] = useState("");

  const keyword = query.trim();
  const results = keyword
    ? USERS.filter((user) => user.nickname.includes(keyword))
    : [];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "회원 검색" }} />

      <YStack px="$4" pt="$4" pb="$2">
        <FormInput
          value={query}
          onChangeText={setQuery}
          placeholder="닉네임"
          autoFocusNative
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={10}
        />
      </YStack>

      <FlatList
        data={results}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => <UserRow user={item} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          paddingTop: space.$3.val,
          paddingBottom: space.$4.val,
          paddingHorizontal: space.$4.val,
          gap: space.$4.val,
        }}
        ListEmptyComponent={
          <YStack items="center" py="$8">
            <Text theme="gray" color="$color10">
              {keyword
                ? "검색 결과가 없습니다."
                : "닉네임을 입력해주시길 바랍니다."}
            </Text>
          </YStack>
        }
      />
    </SafeAreaView>
  );
}
