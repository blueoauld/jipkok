import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";

// 목록 행 오른쪽의 삭제 버튼이다. 되돌릴 수 없는 동작이라 누를 때 한 번 울린다.
export function RowDeleteButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Button
      size="small"
      variant="secondary"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      {t("action.delete")}
    </Button>
  );
}
