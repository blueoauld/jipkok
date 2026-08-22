import { useRef, useState } from "react";
import { FlatList } from "react-native";
import { YStack } from "tamagui";

import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { ScreenState } from "@/components/ui/ScreenState";
import { UserRow } from "@/components/UserRow";
import { useMemberRanking } from "@/hooks/useMemberRanking";
import { usePagedList } from "@/hooks/usePagedList";
import {
  SCROLL_EVENT_THROTTLE,
  useScrollToTopVisible,
} from "@/hooks/useScrollToTopVisible";
import {
  GENDER_FILTER_VALUES,
  GENDER_FILTERS,
  type GenderFilter,
} from "@/lib/member";
import { memberEmptyMessage } from "@/lib/message";

const ERROR_MESSAGE = "랭킹을 불러오지 못했습니다.";

export default function RankScreen() {
  const [filter, setFilter] = useState<GenderFilter>("전체");
  const listRef = useRef<FlatList>(null);
  const scrollTop = useScrollToTopVisible();

  const ranking = useMemberRanking(GENDER_FILTER_VALUES[filter]);
  const { members, error } = ranking;
  const paged = usePagedList(ranking);

  return (
    <YStack flex={1}>
      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
          values={GENDER_FILTERS}
          value={filter}
          onChange={(next) => {
            setFilter(next);
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
          }}
        />
      </YStack>

      {members ? (
        <FlatList
          {...paged}
          ref={listRef}
          data={members}
          keyExtractor={(member) => String(member.memberId)}
          renderItem={({ item }) => <UserRow member={item} />}
          showsVerticalScrollIndicator={true}
          onScroll={scrollTop.onScroll}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          ListEmptyComponent={<ListEmpty>{memberEmptyMessage()}</ListEmpty>}
        />
      ) : (
        <ScreenState
          error={error}
          message={ERROR_MESSAGE}
          onRetry={() => ranking.refetch()}
        />
      )}

      <ScrollToTopButton
        visible={scrollTop.visible}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
      />
    </YStack>
  );
}
