import type {
  DashboardSummary,
  RecentReport,
  RecentSuspension,
  TrendPoint,
} from "@/lib/types";

export const dashboardSummary: DashboardSummary = {
  pendingMemberReports: 7,
  pendingFeedReports: 3,
  suspendedMembers: 12,
  todaySignups: 41,
};

export const trend: TrendPoint[] = [
  { date: "2026-08-07", signups: 32, reports: 4 },
  { date: "2026-08-08", signups: 45, reports: 6 },
  { date: "2026-08-09", signups: 51, reports: 3 },
  { date: "2026-08-10", signups: 38, reports: 5 },
  { date: "2026-08-11", signups: 29, reports: 2 },
  { date: "2026-08-12", signups: 34, reports: 7 },
  { date: "2026-08-13", signups: 40, reports: 4 },
  { date: "2026-08-14", signups: 47, reports: 5 },
  { date: "2026-08-15", signups: 58, reports: 9 },
  { date: "2026-08-16", signups: 62, reports: 6 },
  { date: "2026-08-17", signups: 44, reports: 3 },
  { date: "2026-08-18", signups: 37, reports: 5 },
  { date: "2026-08-19", signups: 49, reports: 8 },
  { date: "2026-08-20", signups: 41, reports: 10 },
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
