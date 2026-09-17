import { useTranslation } from "react-i18next";
import { YStack } from "tamagui";

import { AttendanceGrass } from "@/components/AttendanceGrass";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAttendanceDays } from "@/hooks/useAttendanceDays";
import { toDateParam } from "@/lib/date";
import { LIST_ROW_PADDING_X, LIST_ROW_VERTICAL_PADDING } from "@/lib/design";

export function AttendanceCard() {
  const { t } = useTranslation();
  const { data, isError, refetch } = useAttendanceDays();

  return (
    <YStack px={LIST_ROW_PADDING_X} py={LIST_ROW_VERTICAL_PADDING.xlarge}>
      {data ? (
        <AttendanceGrass today={data.today} days={data.days} />
      ) : isError ? (
        <ErrorState
          message={t("setting.attendanceError")}
          onRetry={() => refetch()}
        />
      ) : (
        // 불러오는 동안 빈 잔디를 같은 크기로 깔아 카드가 나중에 끼어들지 않게 한다.
        <AttendanceGrass today={toDateParam(new Date())} days={[]} />
      )}
    </YStack>
  );
}
