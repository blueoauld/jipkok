import type { PhoneCountry } from "@/lib/phone/country";
import { currentCountry } from "@/lib/phone/store";

// 국가 코드를 붙일 때 국내 표기의 앞 0이 빠진다. 자릿수는 나라마다 다를 수 있다.
const RULES: Record<
  PhoneCountry,
  { dialCode: string; pattern: RegExp; maxLength: number }
> = {
  KR: { dialCode: "+82", pattern: /^010\d{8}$/, maxLength: 11 },
  JP: { dialCode: "+81", pattern: /^0[789]0\d{8}$/, maxLength: 11 },
  TW: { dialCode: "+886", pattern: /^09\d{8}$/, maxLength: 10 },
};

export function dialCodeOf(country: PhoneCountry) {
  return RULES[country].dialCode;
}

export function maxLengthOf(country: PhoneCountry) {
  return RULES[country].maxLength;
}

export function patternOf(country: PhoneCountry) {
  return RULES[country].pattern;
}

// 서버는 국가 코드가 붙은 형식만 받는다. 화면은 국내 표기로 입력받아 여기서 바꾼다.
export function toE164(phoneNumber: string) {
  return dialCodeOf(currentCountry()) + phoneNumber.slice(1);
}
