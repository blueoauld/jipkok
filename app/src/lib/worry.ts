import type { WorryCategory } from "@/lib/api";

const WORRY_CATEGORY_LABELS: Record<WorryCategory, string> = {
  LOVE: "연애",
  RELATIONSHIP: "인간관계",
  WORK: "직장",
  FAMILY: "가족",
  MIND: "심리",
  LIFE: "생활",
  ETC: "기타",
};

export const WORRY_CATEGORIES = Object.keys(
  WORRY_CATEGORY_LABELS,
) as WorryCategory[];

// 서버가 앱보다 먼저 새 분류를 내려보낼 수 있어 모르는 값은 기타로 그린다.
export function worryCategoryLabel(category: WorryCategory) {
  return WORRY_CATEGORY_LABELS[category] ?? WORRY_CATEGORY_LABELS.ETC;
}
