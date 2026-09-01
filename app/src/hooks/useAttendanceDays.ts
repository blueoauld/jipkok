import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const ATTENDANCE_DAYS_KEY = ["attendances", "days"];

export function useAttendanceDays() {
  const { data } = useQuery({
    queryKey: ATTENDANCE_DAYS_KEY,
    queryFn: api.attendances.days,
  });

  return data;
}
