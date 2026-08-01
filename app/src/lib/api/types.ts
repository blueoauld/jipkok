import type { components } from "./schema";

type Schemas = components["schemas"];

export type SignupRequest = Schemas["SignupRequest"];
export type SignupResponse = Schemas["SignupResponse"];
export type LoginRequest = Schemas["LoginRequest"];
export type TokenResponse = Schemas["TokenResponse"];
export type ReissueRequest = Schemas["ReissueRequest"];

export type MyProfileResponse = Schemas["MyProfileResponse"];
export type MemberSummaryResponse = Schemas["MemberSummaryResponse"];
export type Gender = MyProfileResponse["gender"];
export type SetupProfileRequest = Schemas["SetupProfileRequest"];
export type EditProfileRequest = Schemas["EditProfileRequest"];
export type UpdateCommentRequest = Schemas["UpdateCommentRequest"];
export type HeartbeatRequest = Schemas["HeartbeatRequest"];
export type PhotoUploadUrlResponse = Schemas["PhotoUploadUrlResponse"];
export type CreatePhotoUploadUrlRequest =
  Schemas["CreatePhotoUploadUrlRequest"];
export type PhotoVisibility = CreatePhotoUploadUrlRequest["visibility"];
export type ProfilePhoto = Schemas["ProfilePhotoResponse"];

export type CreateReportRequest = Schemas["CreateReportRequest"];
export type PointRewardResponse = Schemas["PointRewardResponse"];
export type AttendanceResponse = Schemas["AttendanceResponse"];
export type PointHistoryResponse = Schemas["PointHistoryResponse"];
export type PointType = PointHistoryResponse["type"];

export type MemberSummaryPage = Schemas["CursorResponseMemberSummaryResponse"];
export type PointHistoryPage = Schemas["CursorResponsePointHistoryResponse"];

export type CursorPage<T> = {
  items: T[];
  nextCursor?: number;
};
