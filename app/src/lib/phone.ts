const KOREA_DIAL_CODE = "+82";

// 서버는 국가 코드가 붙은 형식만 받는다. 화면은 010으로 입력받아 여기서 바꾼다.
export function toE164(phoneNumber: string) {
  return KOREA_DIAL_CODE + phoneNumber.slice(1);
}
