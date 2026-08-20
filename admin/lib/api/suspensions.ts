import { api } from "@/lib/api/client";
import type { SuspensionFilter } from "@/components/suspensions/suspension-filters";
import type {
  Suspension,
  SuspensionPage,
  SuspensionReason,
  SuspensionType,
} from "@/lib/types";

export type SuspensionListParams = SuspensionFilter & { page: number };

export const fetchSuspensions = (params: SuspensionListParams) =>
  api<SuspensionPage>("/api/admin/suspensions", {
    query: {
      status: params.status === "ALL" ? undefined : params.status,
      type: params.type === "ALL" ? undefined : params.type,
      memberId: params.memberId || undefined,
      page: params.page,
    },
  });

export type CreateSuspensionBody = {
  memberId: number;
  type: SuspensionType;
  reason: SuspensionReason;
  days?: number;
  detail?: string;
};

export const createSuspension = (body: CreateSuspensionBody) =>
  api<Suspension>("/api/admin/suspensions", { method: "POST", body });

export const releaseSuspension = (memberId: number, type: SuspensionType) =>
  api<void>("/api/admin/suspensions/release", {
    method: "POST",
    body: { memberId, type },
  });
