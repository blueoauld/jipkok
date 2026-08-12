import { Stack } from "expo-router";
import { useState } from "react";
import { FlatList } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { EmptyMessage } from "@/components/ui/EmptyMessage";
import { ErrorState } from "@/components/ui/ErrorState";
import { RetroInput } from "@/components/ui/RetroInput";
import { UserRow } from "@/components/UserRow";
import { MIN_KEYWORD_LENGTH, useMemberSearch } from "@/hooks/useMemberSearch";
import { usePagedList } from "@/hooks/usePagedList";
import { isApiError } from "@/lib/api";
import { NICKNAME_MAX_LENGTH } from "@/lib/validation";

const HINT_MESSAGE = `닉네임을 ${MIN_KEYWORD_LENGTH}자 이상 입력해주시길 바랍니다.`;
const EMPTY_MESSAGE = "검색 결과가 없습니다.";
const ERROR_MESSAGE = "검색하지 못했습니다.";

const SCREEN_OPTIONS = { title: "회원 검색" };

export default function MemberSearchScreen() {
  const [keyword, setKeyword] = useState("");
  const [submitted, setSubmitted] = useState("");

  const search = useMemberSearch(submitted);
  const { members, enabled, error, isFetching } = search;
  const paged = usePagedList(search);

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
      <Stack.Screen options={SCREEN_OPTIONS} />

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
          {...paged}
          data={members}
          keyExtractor={(member) => String(member.memberId)}
          renderItem={({ item }) => <UserRow member={item} />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <YStack items="center" gap="$4" py="$8">
              {!enabled ? (
                <EmptyMessage>{HINT_MESSAGE}</EmptyMessage>
              ) : error ? (
                <ErrorState
                  message={isApiError(error) ? error.message : ERROR_MESSAGE}
                  onRetry={() => search.refetch()}
                />
              ) : isFetching ? (
                <Spinner size="small" />
              ) : (
                <EmptyMessage>{EMPTY_MESSAGE}</EmptyMessage>
              )}
            </YStack>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
