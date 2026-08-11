export const PHONE_NUMBER_PATTERN = /^010\d{8}$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 30;

export const PHONE_NUMBER_RULES = {
  required: "휴대폰 번호를 입력해주시길 바랍니다.",
  pattern: {
    value: PHONE_NUMBER_PATTERN,
    message: "휴대폰 번호가 올바르지 않습니다.",
  },
};
