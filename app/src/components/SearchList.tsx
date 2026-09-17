import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, type ListRenderItem } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Spinner, YStack } from "tamagui";

import { EmptyMessage } from "@/components/ui/EmptyMessage";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { usePagedList } from "@/hooks/usePagedList";
import { apiErrorMessage } from "@/lib/alert";
import { NICKNAME_MAX_LENGTH } from "@/lib/validation";

type SearchQuery = {
  enabled: boolean;
  error: unknown;
  isFetching: boolean;
  refetch: () => unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: () => unknown;
};

export function SearchList<T>({
  hint,
  placeholder,
  maxLength = NICKNAME_MAX_LENGTH,
  query,
  submitted,
  onSubmit,
  items,
  keyExtractor,
  renderItem,
}: {
  hint: string;
  placeholder?: string;
  maxLength?: number;
  query: SearchQuery;
  submitted: string;
  onSubmit: (keyword: string) => void;
  items: T[] | undefined;
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
}) {
  const { t } = useTranslation();
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
        <Input
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={submit}
          placeholder={placeholder ?? t("component.nicknamePlaceholder")}
          autoFocusNative
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={maxLength}
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
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <YStack items="center" gap="$4" py="$8">
              {!query.enabled ? (
                <EmptyMessage>{hint}</EmptyMessage>
              ) : query.error ? (
                <ErrorState
                  message={apiErrorMessage(
                    query.error,
                    t("component.searchError"),
                  )}
                  onRetry={query.refetch}
                />
              ) : query.isFetching ? (
                <Spinner size="small" />
              ) : (
                <EmptyMessage>{t("component.searchEmpty")}</EmptyMessage>
              )}
            </YStack>
          }
        />
      </KeyboardAvoidingView>
    </>
  );
}
