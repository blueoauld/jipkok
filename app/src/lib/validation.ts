import { koreaYear } from "@/lib/date";
import i18n from "@/lib/i18n";
import { patternOf } from "@/lib/phone";
import { currentCountry } from "@/lib/phone/store";

const NICKNAME_PATTERN = /^[가-힣ㄱ-ㅎㅏ-ㅣぁ-ゖァ-ヺー々一-龯a-zA-Z0-9 ]+$/;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 30;

export const NICKNAME_MAX_LENGTH = 10;
export const BIRTH_YEAR_LENGTH = 4;
export const BIO_MAX_LENGTH = 1000;
export const WORRY_CONTENT_MAX_LENGTH = 1000;
export const WORRY_COMMENT_MAX_LENGTH = 300;
export const DIARY_CONTENT_MAX_LENGTH = 20000;
export const DIARY_ATTACHMENTS_MAX = 10;
export const CHAT_MESSAGE_MAX_LENGTH = 1000;
export const REPORT_DETAIL_MAX_LENGTH = 1000;
export const MIN_KEYWORD_LENGTH = 2;
export const SEARCH_KEYWORD_MAX_LENGTH = 50;

export const MIN_AGE = 19;
export const MAX_AGE = 90;

const BIRTH_YEAR_PATTERN = /^\d{4}$/;

// react-hook-form은 rules를 마운트 때만 등록하므로 나라는 검증 시점에 읽어야 한다.
export const PHONE_NUMBER_RULES = {
  required: i18n.t("validation.phoneNumberRequired"),
  // 어느 폼에서든 쓰도록 필드 값 타입을 좁히지 않는다.
  validate: (value: unknown) =>
    patternOf(currentCountry()).test(String(value)) ||
    i18n.t("validation.phoneNumberInvalid"),
};

const VERIFICATION_CODE_PATTERN = /^\d{6}$/;

// 언어를 바꾸면 앱이 다시 시작하므로 아래 규칙들은 한 번만 만들어도 된다.
export const VERIFICATION_CODE_RULES = {
  required: i18n.t("validation.codeRequired"),
  pattern: {
    value: VERIFICATION_CODE_PATTERN,
    message: i18n.t("validation.codeInvalid"),
  },
};

const PASSWORD_LENGTH_MESSAGE = i18n.t("validation.passwordLength", {
  min: PASSWORD_MIN_LENGTH,
  max: PASSWORD_MAX_LENGTH,
});

// 비밀번호를 고치면 확인 칸도 다시 검사한다.
export const PASSWORD_RULES = {
  required: i18n.t("validation.passwordRequired"),
  minLength: { value: PASSWORD_MIN_LENGTH, message: PASSWORD_LENGTH_MESSAGE },
  maxLength: { value: PASSWORD_MAX_LENGTH, message: PASSWORD_LENGTH_MESSAGE },
  deps: "passwordConfirm" as const,
};

export const PASSWORD_CONFIRM_RULES = {
  required: i18n.t("validation.passwordConfirmRequired"),
  validate: (value: string, values: { password: string }) =>
    value === values.password || i18n.t("validation.passwordMismatch"),
};

function validateNickname(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return i18n.t("validation.nicknameRequired");
  }

  if (!NICKNAME_PATTERN.test(trimmed)) {
    return i18n.t("validation.nicknameInvalid");
  }

  return true;
}

function validateBirthYear(value: string) {
  if (!value) {
    return i18n.t("validation.birthYearRequired");
  }

  if (!BIRTH_YEAR_PATTERN.test(value)) {
    return i18n.t("validation.birthYearInvalid");
  }

  // 서버는 한국 연도로 나이를 재므로 기기 연도를 쓰면 연초 몇 시간 동안 판정이 갈린다.
  const age = koreaYear() - Number(value);

  if (age < MIN_AGE || age > MAX_AGE) {
    return i18n.t("validation.ageRange", { min: MIN_AGE, max: MAX_AGE });
  }

  return true;
}

export const NICKNAME_RULES = { validate: validateNickname };
export const BIRTH_YEAR_RULES = { validate: validateBirthYear };

export const CONTACT_BLOCK_MEMO_MAX_LENGTH = 30;
