import type { ko } from "@/lib/i18n/ko";

export const ja: typeof ko = {
  date: {
    justNow: "たった今",
    minutesAgo: "{{count}}分前",
    hoursAgo: "{{count}}時間前",
    daysAgo: "{{count}}日前",
    today: "今日",
    yesterday: "昨日",
    monthDay: "{{month}}月{{day}}日",
    fullDate: "{{year}}/{{month}}/{{day}}",
    yearMonthDay: "{{year}}年{{month}}月{{day}}日",
    clock: "{{meridiem}}{{hour}}:{{minute}}",
    am: "午前",
    pm: "午後",
  },
  worryCategory: {
    LOVE: "恋愛",
    RELATIONSHIP: "人間関係",
    WORK: "仕事",
    FAMILY: "家族",
    MIND: "こころ",
    LIFE: "日常",
    ETC: "その他",
  },
};
