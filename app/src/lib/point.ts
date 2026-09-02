import type { PointType } from "@/lib/api";
import i18n from "@/lib/i18n";

export function pointTypeLabel(type: PointType) {
  return i18n.t(`pointType.${type}`, { defaultValue: i18n.t("pointType.ETC") });
}

export function formatAmount(amount: number) {
  return `${amount > 0 ? "+" : ""}${amount.toLocaleString()}`;
}
