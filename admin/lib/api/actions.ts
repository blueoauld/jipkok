import { api } from "@/lib/api/client";
import type { AdminActionPage } from "@/lib/types";

export const fetchActions = (page: number) =>
  api<AdminActionPage>("/api/admin/actions", { query: { page } });
