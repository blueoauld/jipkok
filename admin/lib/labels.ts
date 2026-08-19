import type {
  DevicePlatform,
  Gender,
  ProfileTarget,
  ReportReason,
  ReportType,
  SuspensionReason,
  SuspensionStatus,
  SuspensionType,
} from "@/lib/types";

export const reportTypeLabels: Record<ReportType, string> = {
  PROFILE: "프로필",
  CHAT: "채팅",
  FEED: "피드",
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
