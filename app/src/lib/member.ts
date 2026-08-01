import type { Gender } from "@/lib/api";

const GENDER_LABELS: Record<Gender, string> = {
  MALE: "남자",
  FEMALE: "여자",
};

export function genderLabel(gender: Gender) {
  return GENDER_LABELS[gender];
}
