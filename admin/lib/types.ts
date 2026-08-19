export type ReportType = "PROFILE" | "CHAT" | "FEED";

export type ReportReason =
  | "OBSCENITY"
  | "MINOR"
  | "MONEY_TRANSACTION"
  | "ABUSE"
  | "IMPERSONATION"
  | "ETC";

export type SuspensionType = "SECRET_PHOTO" | "PROFILE_EDIT" | "SERVICE";

export type SuspensionReason = "SCREEN_CAPTURE" | ReportReason;

export type DashboardSummary = {
  pendingMemberReports: number;
  pendingFeedReports: number;
  suspendedMembers: number;
  todaySignups: number;
};

export type TrendPoint = {
  date: string;
  signups: number;
  reports: number;
};

export type RecentReport = {
  id: number;
  type: ReportType;
  reason: ReportReason;
  reportedMemberId: number;
  reportedNickname: string;
  createdAt: string;
};

export type RecentSuspension = {
  id: number;
  memberId: number;
  nickname: string;
  type: SuspensionType;
  reason: SuspensionReason;
  endsAt: string | null;
  createdAt: string;
};
