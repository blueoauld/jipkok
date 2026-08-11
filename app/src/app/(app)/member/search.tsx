import { Stack } from "expo-router";
import { useState } from "react";
import { FlatList } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTokens, Spinner, Text, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { RetroInput } from "@/components/ui/RetroInput";
import { UserRow } from "@/components/UserRow";
import { MIN_KEYWORD_LENGTH, useMemberSearch } from "@/hooks/useMemberSearch";
import { isApiError } from "@/lib/api";

const NICKNAME_MAX_LENGTH = 10;

const HINT_MESSAGE = `닉네임을 ${MIN_KEYWORD_LENGTH}자 이상 입력해주시길 바랍니다.`;
const EMPTY_MESSAGE = "검색 결과가 없습니다.";
const ERROR_MESSAGE = "검색하지 못했습니다.";

export default function MemberSearchScreen() {
  const space = getTokens().space;
  const [keyword, setKeyword] = useState("");
  const [submitted, setSubmitted] = useState("");

  const search = useMemberSearch(submitted);
  const {
    members,
    enabled,
    error,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = search;

  const submit = () => {
    const next = keyword.trim();

    if (next === submitted) {
      if (enabled) {
        search.refetch();
      }
      return;
    }

    setSubmitted(next);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "회원 검색" }} />

      <YStack px="$4" pt="$4" pb="$3">
        <RetroInput
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={submit}
          placeholder="닉네임"
          autoFocusNative
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={NICKNAME_MAX_LENGTH}
        />
      </YStack>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        automaticOffset
      >
        <FlatList
          data={members}
          keyExtractor={(member) => String(member.memberId)}
          renderItem={({ item }) => <UserRow member={item} />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: space.$2.val,
            paddingBottom: space.$4.val,
            paddingHorizontal: space.$4.val,
            gap: space.$4.val,
          }}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <YStack items="center" py="$4">
                <Spinner size="small" />
              </YStack>
            ) : null
          }
          ListEmptyComponent={
            <YStack items="center" gap="$4" py="$8">
              {!enabled ? (
                <Text theme="gray" color="$color10" fontSize="$4">
                  {HINT_MESSAGE}
                </Text>
              ) : error ? (
                <>
                  <Text color="$gray10" fontSize="$4" text="center">
                    {isApiError(error) ? error.message : ERROR_MESSAGE}
                  </Text>

                  <RetroButton onPress={() => search.refetch()}>
                    다시 시도
                  </RetroButton>
                </>
              ) : isFetching ? (
                <Spinner size="small" />
              ) : (
                <Text theme="gray" color="$color10" fontSize="$4">
                  {EMPTY_MESSAGE}
                </Text>
              )}
            </YStack>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
