export const PHONE_NUMBER_PATTERN = /^010\d{8}$/;

const NICKNAME_PATTERN = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 30;

export const NICKNAME_MAX_LENGTH = 10;
export const BIRTH_YEAR_LENGTH = 4;
export const BIO_MAX_LENGTH = 1000;
export const WORRY_CONTENT_MAX_LENGTH = 1000;
export const WORRY_COMMENT_MAX_LENGTH = 300;

export const MIN_AGE = 19;
export const MAX_AGE = 90;

const BIRTH_YEAR_PATTERN = /^\d{4}$/;

export const PHONE_NUMBER_RULES = {
  required: "휴대폰 번호를 입력해주시길 바랍니다.",
  pattern: {
    value: PHONE_NUMBER_PATTERN,
    message: "휴대폰 번호가 올바르지 않습니다.",
  },
};

const VERIFICATION_CODE_PATTERN = /^\d{6}$/;

export const VERIFICATION_CODE_RULES = {
  required: "인증번호를 입력해주시길 바랍니다.",
  pattern: {
    value: VERIFICATION_CODE_PATTERN,
    message: "인증번호가 올바르지 않습니다.",
  },
};

const PASSWORD_LENGTH_MESSAGE = `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`;

// 비밀번호를 고치면 확인 칸도 다시 검사한다.
export const PASSWORD_RULES = {
  required: "비밀번호를 입력해주시길 바랍니다.",
  minLength: { value: PASSWORD_MIN_LENGTH, message: PASSWORD_LENGTH_MESSAGE },
  maxLength: { value: PASSWORD_MAX_LENGTH, message: PASSWORD_LENGTH_MESSAGE },
  deps: "passwordConfirm" as const,
};

export const PASSWORD_CONFIRM_RULES = {
  required: "비밀번호를 한 번 더 입력해주시길 바랍니다.",
  validate: (value: string, values: { password: string }) =>
    value === values.password || "비밀번호가 일치하지 않습니다.",
};

function validateNickname(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "닉네임을 입력해주시길 바랍니다.";
  }

  if (!NICKNAME_PATTERN.test(trimmed)) {
    return "닉네임이 올바르지 않습니다.";
  }

  return true;
}

function validateBirthYear(value: string) {
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
