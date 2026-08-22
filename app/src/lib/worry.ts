import type { WorryCategory } from "@/lib/api";
import i18n from "@/lib/i18n";

export const WORRY_CATEGORIES: WorryCategory[] = [
  "LOVE",
  "RELATIONSHIP",
  "WORK",
  "FAMILY",
  "MIND",
  "LIFE",
  "ETC",
];

// 서버가 앱보다 먼저 새 분류를 내려보낼 수 있어 모르는 값은 기타로 그린다.
export function worryCategoryLabel(category: WorryCategory) {
  const known = WORRY_CATEGORIES.includes(category) ? category : "ETC";

  return i18n.t(`worryCategory.${known}`);
}
