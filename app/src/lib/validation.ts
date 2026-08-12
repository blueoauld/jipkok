export const PHONE_NUMBER_PATTERN = /^010\d{8}$/;

export const NICKNAME_PATTERN = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 30;

export const NICKNAME_MAX_LENGTH = 10;
export const BIRTH_YEAR_LENGTH = 4;
export const BIO_MAX_LENGTH = 1000;

const MIN_AGE = 19;
const MAX_AGE = 90;

const BIRTH_YEAR_PATTERN = /^\d{4}$/;

export const PHONE_NUMBER_RULES = {
  required: "휴대폰 번호를 입력해주시길 바랍니다.",
  pattern: {
    value: PHONE_NUMBER_PATTERN,
    message: "휴대폰 번호가 올바르지 않습니다.",
  },
};

export function validateNickname(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "닉네임을 입력해주시길 바랍니다.";
  }

  if (!NICKNAME_PATTERN.test(trimmed)) {
    return "닉네임이 올바르지 않습니다.";
  }

  return true;
}

export function validateBirthYear(value: string) {
  if (!value) {
    return "출생연도를 입력해주시길 바랍니다.";
  }

  if (!BIRTH_YEAR_PATTERN.test(value)) {
    return "출생연도가 올바르지 않습니다.";
  }

  const age = new Date().getFullYear() - Number(value);

  if (age < MIN_AGE || age > MAX_AGE) {
    return `${MIN_AGE}세 이상 ${MAX_AGE}세 이하만 가입할 수 있습니다.`;
  }

  return true;
}

export const NICKNAME_RULES = { validate: validateNickname };
export const BIRTH_YEAR_RULES = { validate: validateBirthYear };
