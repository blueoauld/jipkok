import type { PointType } from "@/lib/api";

const POINT_TYPE_LABELS: Record<PointType, string> = {
  ACCESS_REWARD: "접속 보상",
  ATTENDANCE_REWARD: "출석 보상",
  AD_REWARD: "광고 보상",
  NOTE_SEND: "쪽지 전송",
};

export function pointTypeLabel(type: PointType) {
  return POINT_TYPE_LABELS[type];
}

export function formatAmount(amount: number) {
  return `${amount > 0 ? "+" : ""}${amount.toLocaleString()}`;
}
