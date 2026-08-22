import type { Gender } from "@/lib/api";
import i18n from "@/lib/i18n";
import { MAX_AGE, MIN_AGE } from "@/lib/validation";

export const GENDER_FILTERS = ["ALL", "MALE", "FEMALE"] as const;
export type GenderFilter = (typeof GENDER_FILTERS)[number];

export const GENDER_FILTER_VALUES: Record<GenderFilter, Gender | null> = {
  ALL: null,
  MALE: "MALE",
  FEMALE: "FEMALE",
};

export function genderLabel(gender: Gender) {
  return i18n.t(`gender.${gender}`);
}

export function genderFilterLabel(filter: GenderFilter) {
  return i18n.t(`genderFilter.${filter}`);
}

const METERS_PER_KILOMETER = 1000;

export function formatDistance(meters: number) {
  return `${(meters / METERS_PER_KILOMETER).toFixed(1)}km`;
}

export function formatAgeRange(min: number, max: number) {
  if (min === MIN_AGE && max === MAX_AGE) {
    return i18n.t("component.ageAll");
  }

  if (min === max) {
    return i18n.t("component.ageFrom", { min });
  }

  return i18n.t("component.ageRange", { min, max });
}
