import { Tabs } from "expo-router";
import { FunnelSimpleIcon } from "phosphor-react-native/src/icons/FunnelSimple";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { NotePencilIcon } from "phosphor-react-native/src/icons/NotePencil";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { Text, YStack } from "tamagui";

import { DiaryRow } from "@/components/diary/DiaryRow";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { HeaderIconGroup } from "@/components/HeaderIconGroup";
import { MenuSheet } from "@/components/MenuSheet";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ListRowTopSpacer } from "@/components/ui/ListRow";
import { type DayMarking, RetroCalendar } from "@/components/ui/RetroCalendar";
import { ScreenState } from "@/components/ui/ScreenState";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { useDiaryMonth } from "@/hooks/useDiaries";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useNow } from "@/hooks/useNow";
import { koreaDateParam, toMonthParam } from "@/lib/date";
import { LIST_ROW_EVEN_PADDING_Y, LIST_ROW_PADDING_X } from "@/lib/design";
import { moodEmoji } from "@/lib/diary";
import { type DiarySort, useDiaryFilterStore } from "@/lib/filter/store";
import i18n from "@/lib/i18n";
import { pushOnce } from "@/lib/router";

const SORTS: DiarySort[] = ["LATEST", "OLDEST"];

const SORT_ITEMS = SORTS.map((value) => ({
  value,
  label: i18n.t(`diary.sort.${value}`),
}));

export default function DiaryScreen() {
  const { t } = useTranslation();
  const today = koreaDateParam(useNow());
  const [month, setMonth] = useState(() => toMonthParam(today));
  const { data: diaries, error, refetch } = useDiaryMonth(month);
  const { data: profile } = useMyProfile();

  const sort = useDiaryFilterStore((state) => state.sort);
  const setSort = useDiaryFilterStore((state) => state.setSort);
  const [filterOpen, setFilterOpen] = useState(false);

  const openEntry = useCallback(
    (entryDate: string) => pushOnce(`/diary/${entryDate}`),
    [],
  );
  const openToday = useCallback(() => openEntry(today), [openEntry, today]);
  const openFilter = useCallback(() => setFilterOpen(true), []);

  const screenOptions = useMemo(
    () => ({
      headerLeft: () => (
        <HeaderIconButton
          icon={MagnifyingGlassIcon}
          label={t("a11y.search")}
          onPress={() => pushOnce("/diary/search")}
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
            label={t("diary.writeToday")}
            onPress={openToday}
          />
        </HeaderIconGroup>
      ),
    }),
    [openFilter, openToday, t],
  );
  const markedDates = useMemo(
    () =>
      Object.fromEntries(
        (diaries ?? []).map((diary): [string, DayMarking] => [
          diary.entryDate,
          { marked: true, emoji: moodEmoji(diary.mood) ?? undefined },
        ]),
      ),
    [diaries],
  );
  // 서버는 날짜 오름차순으로 주므로 최신순일 때만 뒤집는다.
  const rows = useMemo(() => {
    if (!diaries) {
      return [];
    }

    return sort === "LATEST" ? [...diaries].reverse() : diaries;
  }, [diaries, sort]);
  const tabBarOverlay = useTabBarOverlay();
  const contentStyle = useMemo(
    () => ({ paddingBottom: LIST_ROW_EVEN_PADDING_Y + tabBarOverlay }),
    [tabBarOverlay],
  );

  return (
    <YStack flex={1}>
      <Tabs.Screen options={screenOptions} />

      <FlatList
        data={rows}
        keyExtractor={(diary) => diary.entryDate}
        renderItem={({ item }) => <DiaryRow diary={item} onPress={openEntry} />}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <RetroCalendar
              initialDate={today}
              minDate={profile?.signupDate}
              maxDate={today}
              markedDates={markedDates}
              onDayPress={(day) => openEntry(day.dateString)}
              onMonthChange={(day) => setMonth(toMonthParam(day.dateString))}
            />

            <Text
              theme="gray"
              color="$color11"
              fontSize="$2"
              px={LIST_ROW_PADDING_X.small}
            >
              {t("diary.notice")}
            </Text>

            <ListRowTopSpacer verticalPadding={LIST_ROW_EVEN_PADDING_Y} />
          </>
        }
        ListEmptyComponent={
          diaries ? (
            <ListEmpty>{t("diary.empty")}</ListEmpty>
          ) : (
            <ScreenState
              error={error}
              message={t("diary.loadFailed")}
              onRetry={() => refetch()}
            />
          )
        }
      />

      <MenuSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        items={SORT_ITEMS.map(({ value, label }) => ({
          label,
          selected: value === sort,
          onPress: () => setSort(value),
        }))}
      />
    </YStack>
  );
}
