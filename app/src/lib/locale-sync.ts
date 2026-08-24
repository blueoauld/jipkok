import { api, type MemberLocale } from "@/lib/api";
import { currentLocale, type SupportedLocale } from "@/lib/i18n";

// 앱의 언어 목록과 서버가 받는 값을 여기서 묶는다.
// 앱에 언어를 더하면 이 표가 비어 컴파일이 막는다.
const SERVER_LOCALES: Record<SupportedLocale, MemberLocale> = {
  ko: "KO",
  ja: "JA",
  en: "EN",
  zh: "ZH_TW",
};

export function serverLocale(): MemberLocale {
  return SERVER_LOCALES[currentLocale()];
}

export async function syncLocale() {
  await api.members.updateLocale(serverLocale());
}
