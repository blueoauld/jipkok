import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { FunnelSimpleIcon } from "phosphor-react-native/src/icons/FunnelSimple";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { NotePencilIcon } from "phosphor-react-native/src/icons/NotePencil";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { getTokens, Spinner, XStack, YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import {
  SCROLL_EVENT_THROTTLE,
  ScrollToTopButton,
  useScrollToTopVisible,
} from "@/components/ScrollToTopButton";
import { TextInputDialog } from "@/components/TextInputDialog";
import { EmptyMessage } from "@/components/ui/EmptyMessage";
import { ErrorState } from "@/components/ui/ErrorState";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { UserRow } from "@/components/UserRow";
import { useLocationUpdate } from "@/hooks/useLocationUpdate";
import { useMemberFeed } from "@/hooks/useMemberFeed";
import { MY_PROFILE_KEY, useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, isApiError, type MemberSort } from "@/lib/api";
import { useMemberFilterStore } from "@/lib/filter/store";
import {
  GENDER_FILTER_VALUES,
  GENDER_FILTERS,
  genderLabel,
} from "@/lib/member";
import { pushOnce } from "@/lib/router";

const FILTERS = ["최근", "거리"] as const;
type Filter = (typeof FILTERS)[number];

const SORTS: Record<Filter, MemberSort> = { 최근: "RECENT", 거리: "DISTANCE" };
const SORT_LABELS: Record<MemberSort, Filter> = {
  RECENT: "최근",
  DISTANCE: "거리",
};

const COMMENT_MAX_LENGTH = 100;

const ERROR_MESSAGE = "목록을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "회원이 없습니다.";
const COMMENT_SAVED_MESSAGE = "코멘트가 작성되었습니다.";

const MEMBERS_KEY = ["members"];

export default function MainScreen() {
  const space = getTokens().space;
  const [genderOpen, setGenderOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList>(null);
  const scrollTop = useScrollToTopVisible();

  const queryClient = useQueryClient();
  const location = useLocationUpdate();
  const sort = useMemberFilterStore((state) => state.sort);
  const gender = useMemberFilterStore((state) => state.gender);
  const setSort = useMemberFilterStore((state) => state.setSort);
  const setGender = useMemberFilterStore((state) => state.setGender);
  const feed = useMemberFeed(sort, gender);
  const { data: profile } = useMyProfile();
  const { alertElement, show, showApiError } = useRetroAlert();

  const updateComment = useMutation({
    mutationFn: api.members.updateComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      show("info", COMMENT_SAVED_MESSAGE);
    },
    onError: showApiError,
  });
  const {
    members,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchFeed,
  } = feed;
  const { update: updateLocation, refresh: refreshLocation } = location;

  // 위치가 없으면 서버가 최근순으로 주므로 세그먼트를 되돌리지 않는다.
  const scrollToTop = useCallback(
    () => listRef.current?.scrollToOffset({ offset: 0, animated: false }),
    [],
  );

  const changeFilter = useCallback(
    async (next: Filter) => {
      setSort(SORTS[next]);
      scrollToTop();

      if (next === "거리" && (await updateLocation())) {
        queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
      }
    },
    [queryClient, scrollToTop, setSort, updateLocation],
  );

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([refreshLocation(), refetchFeed()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchFeed, refreshLocation]);

  const openGender = useCallback(() => setGenderOpen(true), []);
  const openComment = useCallback(() => setCommentOpen(true), []);

  const screenOptions = useMemo(
    () => ({
      headerLeft: () => (
        <HeaderIconButton
          icon={MagnifyingGlassIcon}
          onPress={() => pushOnce("/member/search")}
        />
      ),
      headerRight: () => (
        <XStack>
          <HeaderIconButton icon={FunnelSimpleIcon} onPress={openGender} />
          <HeaderIconButton icon={NotePencilIcon} onPress={openComment} />
        </XStack>
      ),
    }),
    [openGender, openComment],
  );

  return (
    <YStack flex={1}>
      <Tabs.Screen options={screenOptions} />

      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
          values={FILTERS}
          value={SORT_LABELS[sort]}
          onChange={changeFilter}
        />
      </YStack>

      {members ? (
        <FlatList
          ref={listRef}
          data={members}
          keyExtractor={(member) => String(member.memberId)}
          renderItem={({ item }) => <UserRow member={item} />}
          showsVerticalScrollIndicator={true}
          onScroll={scrollTop.onScroll}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          contentContainerStyle={{
            paddingTop: space.$2.val,
            paddingBottom: space.$4.val,
            paddingHorizontal: space.$4.val,
            gap: space.$4.val,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
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
            <YStack items="center" py="$8">
              <EmptyMessage>{EMPTY_MESSAGE}</EmptyMessage>
            </YStack>
          }
        />
      ) : (
        <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
          {error ? (
            <ErrorState
              message={isApiError(error) ? error.message : ERROR_MESSAGE}
              onRetry={refetchFeed}
            />
          ) : (
            <Spinner size="small" />
          )}
        </YStack>
      )}

      <ScrollToTopButton
        visible={scrollTop.visible}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
      />

      <TextInputDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        title="코멘트"
        placeholder="내용 입력"
        maxLength={COMMENT_MAX_LENGTH}
        defaultValue={profile?.comment ?? ""}
        onSubmit={(comment) => updateComment.mutate({ comment })}
      />

      <MenuSheet
        open={genderOpen}
        onOpenChange={setGenderOpen}
        items={GENDER_FILTERS.map((label) => ({
          label,
          selected: label === (gender ? genderLabel(gender) : "전체"),
          onPress: () => {
            setGender(GENDER_FILTER_VALUES[label]);
            scrollToTop();
          },
        }))}
      />

      {alertElement}
      {location.locationAlertElement}
    </YStack>
  );
}
