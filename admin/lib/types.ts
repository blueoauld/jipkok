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
  withdrawnAt: string | null;
  joinedAt: string;
};

export type SuspensionStatus = "ACTIVE" | "EXPIRED" | "RELEASED";

export type Suspension = {
  id: number;
  memberId: number;
  nickname: string;
  type: SuspensionType;
  reason: SuspensionReason;
  startedAt: string;
  expiresAt: string | null;
  releasedAt: string | null;
  status: SuspensionStatus;
};

export type ChatMessageType = "TEXT" | "PHOTO" | "VIDEO";

export type ReportedMemberSnapshot = {
  id: number;
  nickname: string;
  phoneNumber: string;
  gender: Gender;
  age: number;
  comment: string | null;
  bio: string | null;
  profilePhotoUrls: (string | null)[];
};

export type ChatMessageSnapshot = {
  id: number;
  senderId: number;
  type: ChatMessageType;
  content: string | null;
  photoUrl: string | null;
  createdAt: string;
};

export type MemberReportDetail = {
  id: number;
  type: MemberReportType;
  reason: ReportReason;
  detail: string | null;
  createdAt: string;
  handledAt: string | null;
  reporter: { id: number; nickname: string };
  reported: ReportedMemberSnapshot;
  evidencePhotoUrls: (string | null)[];
  messages: ChatMessageSnapshot[];
};

export type ProfileTarget =
  "NICKNAME" | "COMMENT" | "BIO" | "PUBLIC_PHOTO" | "SECRET_PHOTO";

export type MemberDetail = {
  id: number;
  nickname: string;
  phoneNumber: string;
  gender: Gender;
  age: number;
  comment: string | null;
  bio: string | null;
  receivedLikeCount: number;
  pointBalance: number;
  noteReceiveEnabled: boolean;
  latitude: number | null;
  longitude: number | null;
  locatedAt: string | null;
  joinedAt: string;
  withdrawnAt: string | null;
  publicPhotoUrls: (string | null)[];
  secretPhotoUrls: (string | null)[];
  suspensions: Suspension[];
  receivedReports: MemberReport[];
};
