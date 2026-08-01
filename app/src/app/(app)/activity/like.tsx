import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList } from "@/hooks/useMemberList";
import { alertApiError } from "@/lib/alert";
import { api, type MemberSummaryPage } from "@/lib/api";

const LIKES_KEY = ["likes", "mine"];

export default function LikeListScreen() {
  const queryClient = useQueryClient();
  const query = useMemberList(LIKES_KEY, api.likes.mine);

  const cancel = useMutation({
    mutationFn: api.likes.remove,
    onMutate: async (memberId: number) => {
      await queryClient.cancelQueries({ queryKey: LIKES_KEY });
      const previous =
        queryClient.getQueryData<InfiniteData<MemberSummaryPage>>(LIKES_KEY);

      queryClient.setQueryData<InfiniteData<MemberSummaryPage>>(
        LIKES_KEY,
        (current) =>
          current && {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.memberId !== memberId),
            })),
          },
      );

      return { previous };
    },
    onError: (error, _memberId, context) => {
      queryClient.setQueryData(LIKES_KEY, context?.previous);
      alertApiError(error);
    },
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "좋아요 목록" }} />

      <ActivityList
        query={query}
        onDelete={(member) => cancel.mutate(member.memberId)}
      />
    </SafeAreaView>
  );
}
