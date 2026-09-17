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
import { LIST_ROW_EVEN_PADDING_Y, SCREEN_PADDING } from "@/lib/design";
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
  layout,
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
  layout?: "retro" | "cards" | "rows";
}) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState("");
  const paged = usePagedList(query, 0, layout);

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
      {/* 행 목록은 첫 행 위 여백과 합쳐 검색창 아래도 좌우 여백과 같아지게 한다. */}
      <YStack
        px={SCREEN_PADDING}
        pt={SCREEN_PADDING}
        pb={layout === "rows" ? LIST_ROW_EVEN_PADDING_Y : "$3"}
        bg="$background"
      >
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
