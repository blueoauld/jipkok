import { LocaleConfig } from "react-native-calendars";

import { currentLocale } from "@/lib/i18n";

const KO_MONTHS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

const CJK_MONTHS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

const KO_DAYS = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

const JA_DAYS = [
  "日曜日",
  "月曜日",
  "火曜日",
  "水曜日",
  "木曜日",
  "金曜日",
  "土曜日",
];

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const EN_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ZH_DAYS = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

// 달력은 i18next가 아니라 라이브러리의 로케일 표를 쓴다.
LocaleConfig.locales.ko = {
  monthNames: KO_MONTHS,
  monthNamesShort: KO_MONTHS,
  dayNames: KO_DAYS,
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘",
};

LocaleConfig.locales.ja = {
  monthNames: CJK_MONTHS,
  monthNamesShort: CJK_MONTHS,
  dayNames: JA_DAYS,
  dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],
  today: "今日",
};

LocaleConfig.locales.en = {
  monthNames: EN_MONTHS,
  monthNamesShort: EN_MONTHS,
  dayNames: EN_DAYS,
  dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  today: "Today",
};

LocaleConfig.locales.zh = {
  monthNames: CJK_MONTHS,
  monthNamesShort: CJK_MONTHS,
  dayNames: ZH_DAYS,
  dayNamesShort: ["日", "一", "二", "三", "四", "五", "六"],
  today: "今天",
};

LocaleConfig.defaultLocale = currentLocale();
