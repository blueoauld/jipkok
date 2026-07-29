import { useState } from "react";
import { FlatList } from "react-native";
import { Avatar, Button, getTokens, Text, XStack, YStack } from "tamagui";

const FILTERS = ["전체", "남자", "여자"] as const;
type Filter = (typeof FILTERS)[number];

type User = {
  id: string;
  nickname: string;
};

const USERS: User[] = Array.from({ length: 100 }, (_, index) => ({
  id: String(index),
  nickname: `닉네임 ${index}`,
}));

function UserRow({ user }: { user: User }) {
  return (
    <XStack gap="$3" items="center">
      <Avatar size="$6" rounded="$7">
        <Avatar.Image src="http://picsum.photos/200/300" />
        <Avatar.Fallback theme="gray" bg="$color5"></Avatar.Fallback>
      </Avatar>

      <YStack flex={1} gap="$1">
        <XStack items="center" justify="space-between" gap="$2">
          <Text flex={1} numberOfLines={1} fontSize="$4" fontWeight="600">
            {user.nickname}
          </Text>
          <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
            방금 전
          </Text>
        </XStack>

        <Text theme="gray" color="$color10" fontSize="$3">
          남자 · 20살 · ♥ 100
        </Text>

        <XStack items="center" justify="space-between" gap="$2">
          <Text
            flex={1}
            numberOfLines={1}
            theme="gray"
            color="$color10"
            fontSize="$3"
          >
            코멘트
          </Text>
          <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
            0.2km
          </Text>
        </XStack>
      </YStack>
    </XStack>
  );
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (value: Filter) => void;
}) {
  return (
    <XStack bg="$gray4" rounded="$4" p="$1" gap="$1">
      {FILTERS.map((filter) => {
        const selected = filter === value;

        return (
          <Button
            key={filter}
            flex={1}
            size="$2"
            rounded="$3"
            borderWidth={0}
            bg={selected ? "$gray1" : "transparent"}
            pressStyle={{ bg: selected ? "$gray1" : "$gray5" }}
            onPress={() => onChange(filter)}
          >
            <Text fontWeight={selected ? "600" : "400"} color="$color">
              {filter}
            </Text>
          </Button>
        );
      })}
    </XStack>
  );
}

export default function RankScreen() {
  const space = getTokens().space;
  const [filter, setFilter] = useState<Filter>("전체");

  return (
    <YStack flex={1}>
      <YStack px="$4" pt="$4" pb="$2">
        <SegmentedControl value={filter} onChange={setFilter} />
      </YStack>

      <FlatList
        data={USERS}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => <UserRow user={item} />}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          paddingTop: space.$3.val,
          paddingBottom: space.$4.val,
          paddingHorizontal: space.$4.val,
          gap: space.$4.val,
        }}
      />
    </YStack>
  );
}
