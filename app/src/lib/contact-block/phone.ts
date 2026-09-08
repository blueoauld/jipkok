import { dialCodeOf } from "@/lib/phone";
import type { PhoneCountry } from "@/lib/phone/country";

// 서버가 받는 형식과 같다. 주소록 번호는 기기마다 표기가 제각각이라 여기서 거른다.
const E164_PATTERN = /^(\+8210|\+81[789]0|\+8869)\d{8}$/;

// 국가 코드가 없는 국내 표기는 기기 국가의 코드를 붙이고, 이미 붙어 있으면 그대로 둔다.
export function normalizeContactNumber(
  raw: string,
  country: PhoneCountry,
): string | null {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 0) {
    return null;
  }

  const candidate = raw.trim().startsWith("+")
    ? `+${digits}`
    : digits.startsWith("0")
      ? `${dialCodeOf(country)}${digits.slice(1)}`
      : `+${digits}`;

  return E164_PATTERN.test(candidate) ? candidate : null;
}

export function normalizeContactNumbers(
  raws: readonly string[],
  country: PhoneCountry,
): string[] {
  const normalized = new Set<string>();

  raws.forEach((raw) => {
    const number = normalizeContactNumber(raw, country);

    if (number) {
      normalized.add(number);
    }
  });

  return [...normalized];
}
