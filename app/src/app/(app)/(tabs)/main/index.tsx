import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { FunnelSimpleIcon } from "phosphor-react-native/src/icons/FunnelSimple";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { NotePencilIcon } from "phosphor-react-native/src/icons/NotePencil";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { YStack } from "tamagui";

import { RowListAdCard } from "@/components/ad/RowListAdCard";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { HeaderIconGroup } from "@/components/HeaderIconGroup";
import { MemberFilterSheet } from "@/components/MemberFilterSheet";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { TextInputDialog } from "@/components/TextInputDialog";
import { Button } from "@/components/ui/Button";
import { EmptyMessage } from "@/components/ui/EmptyMessage";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { Tab } from "@/components/ui/Tab";
import { UserRow, UserRowTopSpacer } from "@/components/UserRow";
import { useAlert } from "@/hooks/useAlert";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { useListNativeAds } from "@/hooks/useListNativeAds";
import { useLocationUpdate } from "@/hooks/useLocationUpdate";
import { MEMBERS_KEY, useMembers } from "@/hooks/useMembers";
import { MY_PROFILE_KEY, useMyProfile } from "@/hooks/useMyProfile";
import { usePagedList } from "@/hooks/usePagedList";
import { usePullRefresh } from "@/hooks/usePullRefresh";
import {
  SCROLL_EVENT_THROTTLE,
  useScrollToTopVisible,
} from "@/hooks/useScrollToTopVisible";
import {
  listAdAfter,
  MEMBER_LIST_AD_INTERVAL,
  MEMBER_LIST_NATIVE_AD_UNIT_ID,
} from "@/lib/ads";
import { api } from "@/lib/api";
import {
  DEFAULT_MEMBER_FILTER,
  isDefaultMemberFilter,
  type MemberFilter,
  type MemberListSort,
  useMemberFilterStore,
} from "@/lib/filter/store";
import i18n from "@/lib/i18n";
import { listErrorMessage, memberEmptyMessage } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { pushOnce } from "@/lib/router";
import { showToast } from "@/lib/toast/store";

const SORTS: MemberListSort[] = ["RECENT", "DISTANCE", "RANK"];

const SORT_ITEMS = SORTS.map((value) => ({
  value,
  label: i18n.t(`main.sort.${value}`),
}));

const COMMENT_MAX_LENGTH = 100;

const MEMBER_LIST_ADS = {
  unitId: MEMBER_LIST_NATIVE_AD_UNIT_ID,
  interval: MEMBER_LIST_AD_INTERVAL,
  imageOnly: true,
};

export default function MainScreen() {
  const { t } = useTranslation();
  const [filterOpen, setFilterOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const listRef = useRef<FlatList>(null);
  const scrollTop = useScrollToTopVisible();

  const queryClient = useQueryClient();
  const sort = useMemberFilterStore((state) => state.sort);
  const gender = useMemberFilterStore((state) => state.gender);
  const minAge = useMemberFilterStore((state) => state.minAge);
  const maxAge = useMemberFilterStore((state) => state.maxAge);
  const setSort = useMemberFilterStore((state) => state.setSort);
  const setFilter = useMemberFilterStore((state) => state.setFilter);
  const filter = useMemo<MemberFilter>(
    () => ({ gender, minAge, maxAge }),
    [gender, minAge, maxAge],
  );
  const filtered = !isDefaultMemberFilter(filter);
  const memberList = useMembers(sort, filter);
  const { data: profile } = useMyProfile();
  const { alertElement, show, showApiError, confirm } = useAlert();
  const location = useLocationUpdate({ show, showApiError, confirm });

  const updateComment = useMutation({
    mutationFn: api.members.updateComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      showToast("info", t("profile.commentSaved"));
    },
    onError: showApiError,
  });
  const { members, error, refetch: refetchMembers } = memberList;
  const {
    ads,
    renew: renewAds,
    viewability: adViewability,
  } = useListNativeAds(
    MEMBER_LIST_ADS,
    members?.length ?? 0,
    `${sort}:${gender}:${minAge}:${maxAge}`,
  );
  const tabBarOverlay = useTabBarOverlay();
  const paged = usePagedList(memberList, tabBarOverlay, "rows");

  useLoadingOverlay(updateComment.isPending);
  const { update: updateLocation, refresh: refreshLocation } = location;

  const scrollToTop = useCallback(
    () => listRef.current?.scrollToOffset({ offset: 0, animated: false }),
    [],
  );

  // 위치가 없으면 서버가 최근순으로 주므로 탭을 되돌리지 않는다.
  const changeSort = useCallback(
    async (next: MemberListSort) => {
      setSort(next);
      scrollToTop();

      if (next === "DISTANCE" && (await updateLocation())) {
        queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
      }
    },
    [queryClient, scrollToTop, setSort, updateLocation],
  );

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const { refreshing, onRefresh } = usePullRefresh(
    useCallback(() => {
      renewAds();

      return Promise.all([refreshLocation(), refetchMembers()]);
    }, [refetchMembers, refreshLocation, renewAds]),
  );

  const openFilter = useCallback(() => setFilterOpen(true), []);
  const openComment = useCallback(() => setCommentOpen(true), []);
  const applyFilter = useCallback(
    (next: MemberFilter) => {
      setFilter(next);
      scrollToTop();
    },
    [scrollToTop, setFilter],
  );

  const screenOptions = useMemo(
    () => ({
      title: t("tabs.main"),
      headerLeft: () => (
        <HeaderIconButton
          icon={MagnifyingGlassIcon}
          label={t("a11y.search")}
          onPress={() => pushOnce("/member/search")}
        />
      ),
      headerRight: () => (
        <HeaderIconGroup>
          <HeaderIconButton
            icon={FunnelSimpleIcon}
            label={t("a11y.filter")}
            onPress={openFilter}
          />
          <HeaderIconButton
            icon={NotePencilIcon}
            label={t("a11y.compose")}
            onPress={openComment}
          />
        </HeaderIconGroup>
      ),
    }),
    [openFilter, openComment, t],
  );

  return (
    <YStack flex={1}>
      <Stack.Screen options={screenOptions} />

      <Tab items={SORT_ITEMS} value={sort} onChange={changeSort} />

      {members ? (
        <FlatList
          {...paged}
          {...adViewability}
          ref={listRef}
          removeClippedSubviews
          data={members}
          keyExtractor={(member) => String(member.memberId)}
          renderItem={({ item, index }) => {
            const ad = listAdAfter(ads, index, MEMBER_LIST_AD_INTERVAL);

            return (
              <>
                <UserRow member={item} />
                {ad && <RowListAdCard ad={ad} />}
              </>
            );
          }}
          ListHeaderComponent={UserRowTopSpacer}
          showsVerticalScrollIndicator={true}
          onScroll={scrollTop.onScroll}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            filtered ? (
              <YStack items="center" gap="$4" py="$8">
                <EmptyMessage>{t("main.filterEmpty")}</EmptyMessage>
                <Button onPress={() => applyFilter(DEFAULT_MEMBER_FILTER)}>
                  {t("main.resetFilter")}
                </Button>
              </YStack>
            ) : (
              <ListEmpty>{memberEmptyMessage()}</ListEmpty>
            )
          }
        />
      ) : (
        <ScreenState
          error={error}
          message={listErrorMessage()}
          onRetry={refetchMembers}
        />
      )}

      <ScrollToTopButton
        visible={scrollTop.visible}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
      />

      <TextInputDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        title={t("profile.commentTitle")}
        placeholder={t("common.contentPlaceholder")}
        maxLength={COMMENT_MAX_LENGTH}
        defaultValue={profile?.comment ?? ""}
        clearable
        onSubmit={(comment) => updateComment.mutate({ comment })}
      />

      <MemberFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filter={filter}
        onApply={applyFilter}
      />

      {alertElement}
    </YStack>
  );
}
