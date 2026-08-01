import { request } from "./client";
import { clearTokens, getRefreshToken, saveTokens } from "./tokens";
import type {
  AttendanceResponse,
  CreatePhotoUploadUrlRequest,
  CreateReportRequest,
  EditProfileRequest,
  HeartbeatRequest,
  LoginRequest,
  MemberSummaryPage,
  MyProfileResponse,
  PhotoUploadUrlResponse,
  PointHistoryPage,
  PointRewardResponse,
  SetupProfileRequest,
  SignupRequest,
  SignupResponse,
  TokenResponse,
  UpdateCommentRequest,
} from "./types";

type CursorParams = { cursor?: number; size?: number };

export const auth = {
  sendVerificationCode: (phoneNumber: string) =>
    request<void>("/api/auth/verification-codes", {
      method: "POST",
      body: { phoneNumber },
      auth: false,
    }),

  login: async (body: LoginRequest) => {
    const tokens = await request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body,
      auth: false,
    });
    await saveTokens(tokens);

    return tokens;
  },

  logout: async () => {
    const refreshToken = await getRefreshToken();

    // 서버 호출이 실패해도 기기에서는 로그아웃해야 하므로 오류를 삼킨다.
    if (refreshToken) {
      await request<void>("/api/auth/logout", {
        method: "POST",
        body: { refreshToken },
        auth: false,
      }).catch(() => undefined);
    }

    await clearTokens();
  },
};

export const members = {
  signup: async (body: SignupRequest) => {
    const response = await request<SignupResponse>("/api/members", {
      method: "POST",
      body,
      auth: false,
    });
    await saveTokens(response);

    return response;
  },

  myProfile: () => request<MyProfileResponse>("/api/members/me"),

  setupProfile: (body: SetupProfileRequest) =>
    request<void>("/api/members/me/profile", { method: "PATCH", body }),

  editProfile: (body: EditProfileRequest) =>
    request<void>("/api/members/me/profile", { method: "PUT", body }),

  updateComment: (body: UpdateCommentRequest) =>
    request<void>("/api/members/me/comment", { method: "PUT", body }),

  heartbeat: (body: HeartbeatRequest) =>
    request<void>("/api/members/me/heartbeat", { method: "POST", body }),

  createPhotoUploadUrl: (body: CreatePhotoUploadUrlRequest) =>
    request<PhotoUploadUrlResponse>("/api/members/me/photos/upload-url", {
      method: "POST",
      body,
    }),
};

function relation(name: string) {
  return {
    add: (memberId: number) =>
      request<void>(`/api/members/${memberId}/${name}`, { method: "POST" }),

    remove: (memberId: number) =>
      request<void>(`/api/members/${memberId}/${name}`, { method: "DELETE" }),
  };
}

export const likes = {
  ...relation("likes"),

  mine: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/likes", { query: params }),

  received: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/likes/received", {
      query: params,
    }),
};

export const favorites = {
  ...relation("favorites"),

  mine: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/favorites", { query: params }),

  received: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/favorites/received", {
      query: params,
    }),
};

export const secretPhotos = {
  ...relation("secret-photos"),

  granted: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/secret-photos/granted", {
      query: params,
    }),

  received: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/secret-photos/received", {
      query: params,
    }),
};

export const blocks = {
  ...relation("blocks"),

  mine: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/blocks", { query: params }),
};

export const points = {
  balance: () => request<number>("/api/points/me"),

  histories: (params: CursorParams = {}) =>
    request<PointHistoryPage>("/api/points/me/histories", { query: params }),

  earnAccessReward: () =>
    request<PointRewardResponse>("/api/points/rewards/access", {
      method: "POST",
    }),
};

export const attendances = {
  checkIn: () =>
    request<AttendanceResponse>("/api/attendances", { method: "POST" }),
};

export const reports = {
  create: (body: CreateReportRequest) =>
    request<void>("/api/reports", { method: "POST", body }),

  createPhotoUploadUrl: (contentType: string) =>
    request<PhotoUploadUrlResponse>("/api/reports/photos/upload-url", {
      method: "POST",
      body: { contentType },
    }),
};
