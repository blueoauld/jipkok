import type { Gender } from "@/lib/api";
import { MAX_AGE, MIN_AGE } from "@/lib/validation";

const GENDER_LABELS: Record<Gender, string> = {
  MALE: "남자",
  FEMALE: "여자",
};

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

export function formatAgeRange(min: number, max: number) {
  if (min === MIN_AGE && max === MAX_AGE) {
    return "전체";
  }

  if (min === max) {
    return `${min}살`;
  }

  return `${min}살 ~ ${max}살`;
}
