import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { FunnelSimpleIcon } from "phosphor-react-native/src/icons/FunnelSimple";
import { NotePencilIcon } from "phosphor-react-native/src/icons/NotePencil";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { getTokens, Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { HeaderIconGroup } from "@/components/HeaderIconGroup";
import { MenuSheet } from "@/components/MenuSheet";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { type DayMarking, RetroCalendar } from "@/components/ui/RetroCalendar";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScreenState } from "@/components/ui/ScreenState";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { useDiaryMonth } from "@/hooks/useDiaries";
import { useNow } from "@/hooks/useNow";
import type { DiaryResponse } from "@/lib/api";
import {
  formatFullDate,
  fromDateParam,
  koreaDateParam,
  toMonthParam,
} from "@/lib/date";
import { IMAGE_TRANSITION, RETRO_BORDER_WIDTH } from "@/lib/design";
import { moodEmoji } from "@/lib/diary";
import { type DiarySort, useDiaryFilterStore } from "@/lib/filter/store";
import i18n from "@/lib/i18n";
import { photoCacheKey } from "@/lib/photo";
import { pushOnce } from "@/lib/router";

const THUMBNAIL_SIZE = 56;

const SORTS: DiarySort[] = ["LATEST", "OLDEST"];

const SORT_ITEMS = SORTS.map((value) => ({
  value,
  label: i18n.t(`diary.sort.${value}`),
}));

function DiaryRow({
  diary,
  onPress,
}: {
  diary: DiaryResponse;
  onPress: (entryDate: string) => void;
}) {
  const theme = useTheme();
  const emoji = moodEmoji(diary.mood);
  const cover = diary.attachments[0];
  const coverUri = cover ? (cover.thumbnailUrl ?? cover.url) : null;

  return (
    <RetroCard onPress={() => onPress(diary.entryDate)}>
      <XStack items="center" gap="$3">
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600">
            {emoji ? `${emoji} ` : ""}
            {formatFullDate(fromDateParam(diary.entryDate))}
          </Text>
          {diary.content != null && (
            <Text theme="gray" color="$color11" fontSize="$3" numberOfLines={2}>
              {diary.content}
            </Text>
          )}
        </YStack>

        {coverUri && (
          <Image
            source={{ uri: coverUri, cacheKey: photoCacheKey(coverUri) }}
            contentFit="cover"
            transition={IMAGE_TRANSITION}
            style={{
              width: THUMBNAIL_SIZE,
              height: THUMBNAIL_SIZE,
              borderWidth: RETRO_BORDER_WIDTH,
              borderColor: theme.gray12.val,
              backgroundColor: theme.gray12.val,
            }}
          />
        )}
      </XStack>
    </RetroCard>
  );
}

export default function DiaryScreen() {
  const { t } = useTranslation();
  const today = koreaDateParam(useNow());
  const [month, setMonth] = useState(() => toMonthParam(today));
  const { data: diaries, error, refetch } = useDiaryMonth(month);

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
  const gutter = getTokens().space.$4.val;
  const contentStyle = useMemo(
    () => ({
      padding: gutter,
      paddingBottom: gutter + tabBarOverlay,
      gap: gutter,
    }),
    [gutter, tabBarOverlay],
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
          // 달력은 카드 여백에 갇히면 좁아 보여서 화면 양끝까지 편다.
          <YStack mx={-gutter}>
            <RetroCalendar
              initialDate={today}
              maxDate={today}
              markedDates={markedDates}
              onDayPress={(day) => openEntry(day.dateString)}
              onMonthChange={(day) => setMonth(toMonthParam(day.dateString))}
            />

            <Text theme="gray" color="$color11" fontSize="$2" px={gutter}>
              {t("diary.notice")}
            </Text>
          </YStack>
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
