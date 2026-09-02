import { YStack } from "tamagui";

import { AttendanceGrass } from "@/components/AttendanceGrass";
import { RetroCard } from "@/components/ui/RetroCard";
import { useAttendanceDays } from "@/hooks/useAttendanceDays";

export function AttendanceCard() {
  const data = useAttendanceDays();

  if (!data) {
    return null;
  }

  return (
    <YStack mx="$4">
      <RetroCard p="$4">
        <AttendanceGrass today={data.today} days={data.days} />
      </RetroCard>
    </YStack>
  );
}
