import type {
  MyProfileResponse,
  SuspensionReason,
  SuspensionResponse,
} from "@/lib/api";
import i18n from "@/lib/i18n";

export function reasonLabel(reason: SuspensionReason) {
  return i18n.t(`suspensionReason.${reason}`);
}

export function findServiceSuspension(profile?: MyProfileResponse) {
  return profile?.suspensions.find(
    (suspension: SuspensionResponse) => suspension.type === "SERVICE",
  );
}
