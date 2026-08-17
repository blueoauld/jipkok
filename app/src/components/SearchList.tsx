import { useState } from "react";
import { FlatList, type ListRenderItem } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Spinner, YStack } from "tamagui";

import { EmptyMessage } from "@/components/ui/EmptyMessage";
import { ErrorState } from "@/components/ui/ErrorState";
import { RetroInput } from "@/components/ui/RetroInput";
import { usePagedList } from "@/hooks/usePagedList";
import { apiErrorMessage } from "@/lib/alert";
import { NICKNAME_MAX_LENGTH } from "@/lib/validation";

const EMPTY_MESSAGE = "검색 결과가 없습니다.";
const ERROR_MESSAGE = "검색하지 못했습니다.";

type SearchQuery = {
  enabled: boolean;
  error: unknown;
  isFetching: boolean;
  refetch: () => unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
};

export function SearchList<T>({
  hint,
  query,
  submitted,
  onSubmit,
  items,
  keyExtractor,
  renderItem,
}: {
  hint: string;
  query: SearchQuery;
  submitted: string;
  onSubmit: (keyword: string) => void;
  items: T[] | undefined;
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
}) {
  const [keyword, setKeyword] = useState("");
  const paged = usePagedList(query);

  const submit = () => {
    const next = keyword.trim();

    if (next !== submitted) {
      onSubmit(next);
      return;
    }

    if (query.enabled) {
      query.refetch();
    }
  };

  return (
    <>
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
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <YStack items="center" gap="$4" py="$8">
              {!query.enabled ? (
                <EmptyMessage>{hint}</EmptyMessage>
              ) : query.error ? (
                <ErrorState
                  message={apiErrorMessage(query.error, ERROR_MESSAGE)}
                  onRetry={query.refetch}
                />
              ) : query.isFetching ? (
                <Spinner size="small" />
              ) : (
                <EmptyMessage>{EMPTY_MESSAGE}</EmptyMessage>
              )}
            </YStack>
          }
        />
      </KeyboardAvoidingView>
    </>
  );
}
