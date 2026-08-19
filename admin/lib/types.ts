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

export type MemberReportType = Exclude<ReportType, "FEED">;

export type MemberReport = {
  id: number;
  type: MemberReportType;
  reason: ReportReason;
  reporterId: number;
  reporterNickname: string;
  reportedMemberId: number;
  reportedNickname: string;
  createdAt: string;
  handledAt: string | null;
};

export type Page<T> = {
  items: T[];
  page: number;
  size: number;
  totalCount: number;
};

export type FeedReport = {
  id: number;
  reporterId: number;
  reporterNickname: string;
  postId: number;
  authorId: number;
  authorNickname: string;
  thumbnailUrl: string | null;
  caption: string | null;
  postReportCount: number;
  postDeletedAt: string | null;
  createdAt: string;
};

export type Gender = "MALE" | "FEMALE";

export type MemberSummary = {
  id: number;
  nickname: string;
  gender: Gender;
  age: number;
  phoneNumber: string;
  publicPhotoCount: number;
  secretPhotoCount: number;
  suspended: boolean;
  joinedAt: string;
};
