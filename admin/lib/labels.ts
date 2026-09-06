import type {
  AdminActionType,
  DevicePlatform,
  Gender,
  ProfileTarget,
  ReportReason,
  ReportType,
  SmsMessageStatus,
  SuspensionReason,
  SuspensionStatus,
  SuspensionType,
} from "@/lib/types";

export const reportTypeLabels: Record<ReportType, string> = {
  PROFILE: "프로필",
  CHAT: "채팅",
};

export const reportReasonLabels: Record<ReportReason, string> = {
  OBSCENITY: "음란물",
  MINOR: "미성년자",
  MONEY_TRANSACTION: "금전거래",
  ABUSE: "욕설 및 협박",
  IMPERSONATION: "사칭 및 도용",
  ETC: "기타",
};

export const suspensionTypeLabels: Record<SuspensionType, string> = {
  SECRET_PHOTO: "비밀 사진",
  PROFILE_EDIT: "프로필 수정",
  SERVICE: "서비스 이용",
};

export const suspensionReasonLabels: Record<SuspensionReason, string> = {
  SCREEN_CAPTURE: "비밀 사진 캡처",
  ...reportReasonLabels,
};

export const genderLabels: Record<Gender, string> = {
  MALE: "남자",
  FEMALE: "여자",
};

export const suspensionStatusLabels: Record<SuspensionStatus, string> = {
  ACTIVE: "정지",
  EXPIRED: "만료",
  RELEASED: "해제",
};

export const profileTargetLabels: Record<ProfileTarget, string> = {
  NICKNAME: "닉네임",
  COMMENT: "코멘트",
  BIO: "자기소개",
  PUBLIC_PHOTO: "공개 사진",
  SECRET_PHOTO: "비밀 사진",
};

export const devicePlatformLabels: Record<DevicePlatform, string> = {
  IOS: "iOS",
  ANDROID: "Android",
};

export const adminActionLabels: Record<AdminActionType, string> = {
  SUSPEND: "정지",
  RELEASE_SUSPENSION: "정지 해제",
  RESET_PROFILE: "프로필 초기화",
  WITHDRAW_MEMBER: "회원 탈퇴",
  DELETE_FEED_POST: "피드 삭제",
  DELETE_WORRY_POST: "고민 삭제",
  DELETE_WORRY_COMMENT: "고민 댓글 삭제",
  HANDLE_REPORT: "신고 처리",
};

export const smsStatusLabels: Record<SmsMessageStatus, string> = {
  PENDING: "대기",
  SENDING: "발송 중",
  COMPLETE: "완료",
  FAILED: "실패",
};

export const matchTypeLabels: Record<string, string> = {
  EXACT: "정확",
  BROAD: "확장",
};

export const keywordStatusLabels: Record<string, string> = {
  ACTIVE: "활성",
  PAUSED: "일시정지",
};

export const searchTermSourceLabels: Record<string, string> = {
  AUTO: "Search Match",
  TARGETED: "키워드",
};
