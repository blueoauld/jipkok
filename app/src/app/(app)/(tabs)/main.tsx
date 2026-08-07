import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import {
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  NotePencilIcon,
} from "phosphor-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, getTokens, Spinner, Text, XStack, YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import {
  SCROLL_EVENT_THROTTLE,
  ScrollToTopButton,
  useScrollToTopVisible,
} from "@/components/ScrollToTopButton";
import { SegmentedControl } from "@/components/SegmentedControl";
import { TextInputDialog } from "@/components/TextInputDialog";
import { UserRow } from "@/components/UserRow";
import { useLocationUpdate } from "@/hooks/useLocationUpdate";
import { useMemberFeed } from "@/hooks/useMemberFeed";
import { MY_PROFILE_KEY, useMyProfile } from "@/hooks/useMyProfile";
import { alertApiError, alertInfo } from "@/lib/alert";
import { api, type Gender, isApiError, type MemberSort } from "@/lib/api";
import { tabBarOverlayHeight } from "@/lib/design";
import { useMemberFilterStore } from "@/lib/filter/store";
import { pushOnce } from "@/lib/router";

const FILTERS = ["최근", "거리"] as const;
type Filter = (typeof FILTERS)[number];

const GENDERS = ["전체", "남자", "여자"] as const;
type GenderLabel = (typeof GENDERS)[number];

const SORTS: Record<Filter, MemberSort> = { 최근: "RECENT", 거리: "DISTANCE" };
const SORT_LABELS: Record<MemberSort, Filter> = {
  RECENT: "최근",
  DISTANCE: "거리",
};

const GENDER_VALUES: Record<GenderLabel, Gender | null> = {
  전체: null,
  남자: "MALE",
  여자: "FEMALE",
};
const GENDER_LABELS: Record<string, GenderLabel> = {
  MALE: "남자",
  FEMALE: "여자",
};

const COMMENT_MAX_LENGTH = 100;

const ERROR_MESSAGE = "목록을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "회원이 없습니다.";
const COMMENT_SAVED_MESSAGE = "코멘트가 작성되었습니다.";

const MEMBERS_KEY = ["members"];

export default function MainScreen() {
  const space = getTokens().space;
  const insets = useSafeAreaInsets();
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

  const updateComment = useMutation({
    mutationFn: api.members.updateComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      alertInfo(COMMENT_SAVED_MESSAGE);
    },
    onError: alertApiError,
  });
  const { members, error, isFetchingNextPage, hasNextPage, fetchNextPage } =
    feed;

  // 위치가 없으면 서버가 최근순으로 주므로 세그먼트를 되돌리지 않는다.
  const changeFilter = useCallback(
    async (next: Filter) => {
      setSort(SORTS[next]);

      if (next === "거리" && (await location.update())) {
        queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
      }
    },
    [location, queryClient, setSort],
  );

  const refreshLocation = location.refresh;

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([location.refresh(), feed.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [feed, location]);

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

      <YStack px="$4" pt="$4" pb="$2">
        <SegmentedControl
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
            paddingTop: space.$3.val,
            paddingBottom: space.$4.val + tabBarOverlayHeight(insets.bottom),
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
              <Text theme="gray" color="$color10" fontSize="$4">
                {EMPTY_MESSAGE}
              </Text>
            </YStack>
          }
        />
      ) : (
        <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
          {error ? (
            <>
              <Text color="$gray10" fontSize="$4" text="center">
                {isApiError(error) ? error.message : ERROR_MESSAGE}
              </Text>

              <Button
                size="$3"
                theme="blue"
                rounded="$7"
                onPress={() => feed.refetch()}
              >
                다시 시도
              </Button>
            </>
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
        items={GENDERS.map((label) => ({
          label,
          selected: label === (GENDER_LABELS[gender ?? ""] ?? "전체"),
          onPress: () => setGender(GENDER_VALUES[label]),
        }))}
      />
    </YStack>
  );
}
