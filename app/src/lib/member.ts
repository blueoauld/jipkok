import type { Gender } from "@/lib/api";

const GENDER_LABELS: Record<Gender, string> = {
  MALE: "남자",
  FEMALE: "여자",
};

const MIN_AGE = 19;
const MAX_AGE = 90;

export function validateBirthYear(value: string) {
  const age = new Date().getFullYear() - Number(value);

  if (age < MIN_AGE || age > MAX_AGE) {
    return `${MIN_AGE}세 이상 ${MAX_AGE}세 이하만 가입할 수 있습니다.`;
  }

  return true;
}

export const GENDER_FILTERS = ["전체", "남자", "여자"] as const;
export type GenderFilter = (typeof GENDER_FILTERS)[number];

export const GENDER_FILTER_VALUES: Record<GenderFilter, Gender | null> = {
  전체: null,
  남자: "MALE",
  여자: "FEMALE",
};

export function genderLabel(gender: Gender) {
  return GENDER_LABELS[gender];
}

const METERS_PER_KILOMETER = 1000;

export function formatDistance(meters: number) {
  return `${(meters / METERS_PER_KILOMETER).toFixed(1)}km`;
}
