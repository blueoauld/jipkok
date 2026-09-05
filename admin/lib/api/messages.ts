import { api } from "@/lib/api/client";
import type { MessageFilter } from "@/components/messages/message-filters";
import type { SmsMessagePage } from "@/lib/types";

export type MessageListParams = Partial<MessageFilter> & {
  startKey?: string;
};

export const fetchMessages = (params: MessageListParams) =>
  api<SmsMessagePage>("/api/admin/messages", {
    query: {
      to: params.to?.trim() || undefined,
      status: params.status === "ALL" ? undefined : params.status,
      startKey: params.startKey,
    },
  });
