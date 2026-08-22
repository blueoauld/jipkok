import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, YStack } from "tamagui";

import { FormScreen } from "@/components/FormScreen";
import { CountedInput } from "@/components/ui/CountedInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { WorryCategoryPicker } from "@/components/worry/WorryCategoryChips";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { WORRIES_KEY } from "@/hooks/useWorryPosts";
import { api, type WorryCategory } from "@/lib/api";
import { showToast } from "@/lib/toast/store";
import { WORRY_CONTENT_MAX_LENGTH } from "@/lib/validation";

const ANONYMOUS_NOTICE =
  "작성된 고민은 익명으로 올라갑니다. 부적절한 내용 작성 시 서비스 이용이 제한됩니다.";
const POSTED_MESSAGE = "고민을 올렸습니다.";
const CATEGORY_LABEL = "분류";

export default function WorryComposeScreen() {
  const queryClient = useQueryClient();
  const contentRef = useRef("");
  const [empty, setEmpty] = useState(true);
  const [category, setCategory] = useState<WorryCategory | null>(null);
  const { alertElement, show, showApiError } = useRetroAlert();

  useEffect(() => {
    show("info", ANONYMOUS_NOTICE);
  }, [show]);

  const compose = useMutation({
    mutationFn: ({
      category: picked,
      content,
    }: {
      category: WorryCategory;
      content: string;
    }) => api.worries.create(picked, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WORRIES_KEY });
      showToast("info", POSTED_MESSAGE);
      router.back();
    },
    onError: showApiError,
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "고민 작성" }} />

      <FormScreen
        footer={
          <RetroButton
            disabled={empty || !category || compose.isPending}
            onPress={() =>
              category &&
              compose.mutate({ category, content: contentRef.current.trim() })
            }
          >
            {compose.isPending ? <Spinner color="white" /> : "등록"}
          </RetroButton>
        }
      >
        <YStack gap="$2">
          <Text theme="gray" color="$color11" fontSize="$3" fontWeight="600">
            {CATEGORY_LABEL}
          </Text>
          <WorryCategoryPicker value={category} onChange={setCategory} />
        </YStack>

        <CountedInput
          valueRef={contentRef}
          multiline
          rows={10}
          textAlignVertical="top"
          placeholder="내용 입력"
          maxLength={WORRY_CONTENT_MAX_LENGTH}
          onChangeText={(text) => setEmpty(text.trim().length === 0)}
        />
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
