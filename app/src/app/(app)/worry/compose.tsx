import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormScreen } from "@/components/FormScreen";
import { CountedInput } from "@/components/ui/CountedInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { WORRIES_KEY } from "@/hooks/useWorryPosts";
import { api } from "@/lib/api";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { showToast } from "@/lib/toast/store";

const CONTENT_MAX_LENGTH = 500;

const ANONYMOUS_NOTICE =
  "작성된 고민은 익명으로 올라갑니다. 부적절한 내용 작성 시 서비스 이용이 제한됩니다.";
const POSTED_MESSAGE = "고민을 올렸습니다.";

export default function WorryComposeScreen() {
  const queryClient = useQueryClient();
  const contentRef = useRef("");
  const [empty, setEmpty] = useState(true);
  const { alertElement, show, showApiError } = useRetroAlert();

  useEffect(() => {
    show("info", ANONYMOUS_NOTICE);
  }, [show]);

  const compose = useMutation({
    mutationFn: (content: string) => api.worries.create(content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WORRIES_KEY });
      showToast("info", POSTED_MESSAGE);
      router.back();
    },
    onError: showApiError,
  });

  useLoadingOverlay(compose.isPending);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "고민 작성" }} />

      <FormScreen
        footer={
          <RetroButton
            disabled={empty || compose.isPending}
            onPress={() => compose.mutate(contentRef.current.trim())}
          >
            등록
          </RetroButton>
        }
      >
        <CountedInput
          valueRef={contentRef}
          multiline
          rows={10}
          textAlignVertical="top"
          placeholder="내용 입력"
          maxLength={CONTENT_MAX_LENGTH}
          onChangeText={(text) => setEmpty(text.trim().length === 0)}
        />
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
