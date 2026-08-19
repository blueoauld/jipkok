import type {
  AccessEnvironment,
  ActiveUsers,
  DashboardSummary,
  DauPoint,
  Demographics,
  RecentReport,
  RecentSuspension,
  TrendPoint,
} from "@/lib/types";

export const dashboardSummary: DashboardSummary = {
  pendingMemberReports: 7,
  suspendedMembers: 12,
  todaySignups: 41,
  todayWithdrawals: 6,
};

export const trend: TrendPoint[] = [
  { date: "2026-08-07", signups: 32, withdrawals: 5, reports: 4 },
  { date: "2026-08-08", signups: 45, withdrawals: 7, reports: 6 },
  { date: "2026-08-09", signups: 51, withdrawals: 4, reports: 3 },
  { date: "2026-08-10", signups: 38, withdrawals: 6, reports: 5 },
  { date: "2026-08-11", signups: 29, withdrawals: 3, reports: 2 },
  { date: "2026-08-12", signups: 34, withdrawals: 5, reports: 7 },
  { date: "2026-08-13", signups: 40, withdrawals: 6, reports: 4 },
  { date: "2026-08-14", signups: 47, withdrawals: 4, reports: 5 },
  { date: "2026-08-15", signups: 58, withdrawals: 9, reports: 9 },
  { date: "2026-08-16", signups: 62, withdrawals: 8, reports: 6 },
  { date: "2026-08-17", signups: 44, withdrawals: 5, reports: 3 },
  { date: "2026-08-18", signups: 37, withdrawals: 4, reports: 5 },
  { date: "2026-08-19", signups: 49, withdrawals: 7, reports: 8 },
  { date: "2026-08-20", signups: 41, withdrawals: 6, reports: 10 },
];

export const recentReports: RecentReport[] = [
  {
    id: 1042,
    type: "CHAT",
    reason: "ABUSE",
    reportedMemberId: 3310,
    reportedNickname: "밤산책",
    createdAt: "2026-08-20T13:42:00+09:00",
  },
  {
    id: 1041,
    type: "FEED",
    reason: "OBSCENITY",
    reportedMemberId: 2877,
    reportedNickname: "구름빵",
    createdAt: "2026-08-20T12:15:00+09:00",
  },
  {
    id: 1040,
    type: "PROFILE",
    reason: "IMPERSONATION",
    reportedMemberId: 4102,
    reportedNickname: "서울토박이",
    createdAt: "2026-08-20T10:58:00+09:00",
  },
  {
    id: 1039,
    type: "CHAT",
    reason: "MONEY_TRANSACTION",
    reportedMemberId: 1563,
    reportedNickname: "재테크왕",
    createdAt: "2026-08-20T09:21:00+09:00",
  },
  {
    id: 1038,
    type: "PROFILE",
    reason: "MINOR",
    reportedMemberId: 4478,
    reportedNickname: "하루종일",
    createdAt: "2026-08-19T23:04:00+09:00",
  },
];

export const recentSuspensions: RecentSuspension[] = [
  {
    id: 512,
    memberId: 2877,
    nickname: "구름빵",
    type: "SERVICE",
    reason: "OBSCENITY",
    endsAt: "2026-08-27T12:30:00+09:00",
    createdAt: "2026-08-20T12:30:00+09:00",
  },
  {
    id: 511,
    memberId: 3901,
    nickname: "초록불",
    type: "SECRET_PHOTO",
    reason: "SCREEN_CAPTURE",
    endsAt: "2026-09-19T08:10:00+09:00",
    createdAt: "2026-08-20T08:10:00+09:00",
  },
  {
    id: 510,
    memberId: 1563,
    nickname: "재테크왕",
    type: "SERVICE",
    reason: "MONEY_TRANSACTION",
    endsAt: null,
    createdAt: "2026-08-19T18:45:00+09:00",
  },
  {
    id: 509,
    memberId: 2210,
    nickname: "떡볶이러버",
    type: "PROFILE_EDIT",
    reason: "IMPERSONATION",
    endsAt: "2026-08-26T15:00:00+09:00",
    createdAt: "2026-08-19T15:00:00+09:00",
  },
  {
    id: 508,
    memberId: 3310,
    nickname: "밤산책",
    type: "SERVICE",
    reason: "ABUSE",
    endsAt: "2026-08-22T11:20:00+09:00",
    createdAt: "2026-08-19T11:20:00+09:00",
  },
];

export const activeUsers: ActiveUsers = {
  dau: 1284,
  wau: 4631,
  mau: 11920,
};

export const dauTrend: DauPoint[] = [
  { date: "2026-08-07", dau: 1102 },
  { date: "2026-08-08", dau: 1187 },
  { date: "2026-08-09", dau: 1354 },
  { date: "2026-08-10", dau: 1298 },
  { date: "2026-08-11", dau: 1041 },
  { date: "2026-08-12", dau: 1076 },
  { date: "2026-08-13", dau: 1133 },
  { date: "2026-08-14", dau: 1210 },
  { date: "2026-08-15", dau: 1462 },
  { date: "2026-08-16", dau: 1518 },
  { date: "2026-08-17", dau: 1240 },
  { date: "2026-08-18", dau: 1156 },
  { date: "2026-08-19", dau: 1221 },
  { date: "2026-08-20", dau: 1284 },
];

export const demographics: Demographics = {
  male: 31240,
  female: 17860,
  ageGroups: [
    { label: "20대 초", male: 4120, female: 3980 },
    { label: "20대 후", male: 7830, female: 5210 },
    { label: "30대 초", male: 8460, female: 4330 },
    { label: "30대 후", male: 5910, female: 2540 },
    { label: "40대", male: 3720, female: 1390 },
    { label: "50대 이상", male: 1200, female: 410 },
  ],
};

export const accessEnvironment: AccessEnvironment = {
  platforms: { IOS: 2690, ANDROID: 1941 },
  versions: [
    { version: "1.8.2", platform: "IOS", count: 2104 },
    { version: "1.8.2", platform: "ANDROID", count: 1388 },
    { version: "1.8.1", platform: "IOS", count: 402 },
    { version: "1.8.1", platform: "ANDROID", count: 367 },
    { version: "1.7.5", platform: "IOS", count: 184 },
    { version: "1.7.5", platform: "ANDROID", count: 186 },
  ],
};
