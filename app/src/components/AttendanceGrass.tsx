import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

const WEEKS = 13;
const DAYS_PER_WEEK = 7;
const CELL_GAP = 3;

// 날짜는 서버가 주는 한국 시간 기준이라 기기 시간대와 섞이지 않게 문자열로만 다룬다.
function parseDay(day: string) {
  const [year, month, date] = day.split("-").map(Number);

  return new Date(year, month - 1, date);
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);

  return next;
}

function toKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export function AttendanceGrass({
  today,
  days,
}: {
  today: string;
  days: string[];
}) {
  const { t } = useTranslation();

  const attended = new Set(days);
  const todayDate = parseDay(today);
  const start = addDays(
    todayDate,
    -(todayDate.getDay() + (WEEKS - 1) * DAYS_PER_WEEK),
  );
  // 이번 주에서 오늘 뒤의 칸은 비어 보이므로 세지 않는다.
  const visibleDays =
    WEEKS * DAYS_PER_WEEK - (DAYS_PER_WEEK - 1 - todayDate.getDay());
  const startKey = toKey(start);
  const attendedCount = days.filter(
    (day) => day >= startKey && day <= today,
  ).length;

  return (
    <YStack
      gap={CELL_GAP}
      accessible
      accessibilityLabel={t("setting.attendanceGrass", {
        count: attendedCount,
        total: visibleDays,
      })}
    >
      {Array.from({ length: DAYS_PER_WEEK }, (_, day) => (
        <XStack key={day} gap={CELL_GAP}>
          {Array.from({ length: WEEKS }, (_, week) => {
            const date = addDays(start, week * DAYS_PER_WEEK + day);

            return (
              <YStack
                key={week}
                flex={1}
                aspectRatio={1}
                bg={attended.has(toKey(date)) ? "$blue10" : "$gray5"}
                opacity={date > todayDate ? 0 : 1}
              />
            );
          })}
        </XStack>
      ))}
    </YStack>
  );
}
