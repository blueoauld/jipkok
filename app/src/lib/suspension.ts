import type {
  MyProfileResponse,
  SuspensionReason,
  SuspensionResponse,
} from "@/lib/api";

const REASON_LABELS: Record<SuspensionReason, string> = {
  SCREEN_CAPTURE: "화면 캡처",
  OBSCENITY: "음란물",
  MINOR: "미성년자",
  MONEY_TRANSACTION: "금전거래",
  ABUSE: "욕설 및 협박",
  IMPERSONATION: "사칭 및 도용",
  ETC: "기타",
};

export function reasonLabel(reason: SuspensionReason) {
  return REASON_LABELS[reason];
}

export function findServiceSuspension(profile?: MyProfileResponse) {
  return profile?.suspensions.find(
    (suspension: SuspensionResponse) => suspension.type === "SERVICE",
  );
}
