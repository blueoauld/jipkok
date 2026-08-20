import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormScreen } from "@/components/FormScreen";
import { CountedInput } from "@/components/ui/CountedInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { showToast } from "@/lib/toast/store";

const CONTENT_MAX_LENGTH = 500;

const ANONYMOUS_NOTICE =
  "작성된 고민은 익명으로 올라갑니다. 부적절한 내용 작성 시 서비스 이용이 제한됩니다.";
const SUBMIT_PENDING_MESSAGE = "고민 등록은 준비 중입니다.";

export default function WorryComposeScreen() {
  const contentRef = useRef("");
  const [empty, setEmpty] = useState(true);
  const { alertElement, show } = useRetroAlert();

  useEffect(() => {
    show("info", ANONYMOUS_NOTICE);
  }, [show]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "고민 작성" }} />

      <FormScreen
        footer={
          <RetroButton
            disabled={empty}
            onPress={() => showToast("info", SUBMIT_PENDING_MESSAGE)}
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
