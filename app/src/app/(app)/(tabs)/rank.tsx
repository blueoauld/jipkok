import { useState } from "react";
import { FlatList } from "react-native";
import { Button, getTokens, Spinner, Text, YStack } from "tamagui";

import { SegmentedControl } from "@/components/SegmentedControl";
import { UserRow } from "@/components/UserRow";
import { useMemberRanking } from "@/hooks/useMemberRanking";
import { type Gender, isApiError } from "@/lib/api";

const FILTERS = ["전체", "남자", "여자"] as const;
type Filter = (typeof FILTERS)[number];

const GENDER_VALUES: Record<Filter, Gender | null> = {
  전체: null,
  남자: "MALE",
  여자: "FEMALE",
};

const ERROR_MESSAGE = "랭킹을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "회원이 없습니다.";

export default function RankScreen() {
  const space = getTokens().space;
  const [filter, setFilter] = useState<Filter>("전체");

  const ranking = useMemberRanking(GENDER_VALUES[filter]);
  const { members, error, isFetchingNextPage, hasNextPage, fetchNextPage } =
    ranking;

  return (
    <YStack flex={1}>
      <YStack px="$4" pt="$4" pb="$2">
        <SegmentedControl
          values={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </YStack>

      {members ? (
        <FlatList
          data={members}
          keyExtractor={(member) => String(member.memberId)}
          renderItem={({ item }) => <UserRow member={item} />}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{
            paddingTop: space.$3.val,
            paddingBottom: space.$4.val,
            paddingHorizontal: space.$4.val,
            gap: space.$4.val,
          }}
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
                onPress={() => ranking.refetch()}
              >
                다시 시도
              </Button>
            </>
          ) : (
            <Spinner size="small" />
          )}
        </YStack>
      )}
    </YStack>
  );
}
