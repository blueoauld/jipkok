import { api } from "@/lib/api/client";
import type { AiMemberFilter } from "@/components/ai-members/ai-member-filters";
import type {
  AiMemberDetail,
  AiMemberPage,
  AiTestChatBody,
  AiTestChatReply,
  CreateAiMemberBody,
  PhotoUploadUrl,
  PhotoVisibility,
  UpdateAiMemberBody,
} from "@/lib/types";

export type AiMemberListParams = AiMemberFilter & { page: number };

export const fetchAiMembers = (params: AiMemberListParams) =>
  api<AiMemberPage>("/api/admin/ai-members", {
    query: {
      enabled: params.enabled === "ALL" ? undefined : params.enabled === "ON",
      keyword: params.keyword.trim() || undefined,
      page: params.page,
    },
  });

export const fetchAiMemberDetail = (id: number) =>
  api<AiMemberDetail>(`/api/admin/ai-members/${id}`);

export const createAiMember = (body: CreateAiMemberBody) =>
  api<AiMemberDetail>("/api/admin/ai-members", { method: "POST", body });

export const updateAiMember = (id: number, body: UpdateAiMemberBody) =>
  api<AiMemberDetail>(`/api/admin/ai-members/${id}`, { method: "PUT", body });

export const testAiChat = (id: number, body: AiTestChatBody) =>
  api<AiTestChatReply>(`/api/admin/ai-members/${id}/test-chat`, {
    method: "POST",
    body,
  });

export const withdrawAiMember = (id: number) =>
  api<void>(`/api/admin/ai-members/${id}`, { method: "DELETE" });

export const createAiMemberPhotoUploadUrl = (
  id: number,
  visibility: PhotoVisibility,
  contentType: string,
) =>
  api<PhotoUploadUrl>(`/api/admin/ai-members/${id}/photo-upload-url`, {
    method: "POST",
    body: { visibility, contentType },
  });

export const updateAiMemberPhotos = (
  id: number,
  publicPhotoKeys: string[],
  secretPhotoKeys: string[],
) =>
  api<void>(`/api/admin/ai-members/${id}/photos`, {
    method: "PUT",
    body: { publicPhotoKeys, secretPhotoKeys },
  });
