"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBodyOf,
  defaultAiMemberDraft,
  type AiMemberDraft,
} from "@/components/ai-members/ai-member-draft";
import { AiMemberForm } from "@/components/ai-members/ai-member-form";
import { PageHeader } from "@/components/page-header";
import { createAiMember } from "@/lib/api/ai-members";
import { ApiError } from "@/lib/api/client";

export function AiMemberCreate() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (draft: AiMemberDraft) => createAiMember(createBodyOf(draft)),
    onSuccess: (created) => {
      queryClient.setQueryData(["ai-members", "detail", created.id], created);
      queryClient.invalidateQueries({ queryKey: ["ai-members"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      toast.success("AI 계정을 만들었습니다. 이어서 사진을 올릴 수 있습니다.");
      router.replace(`/ai-members/detail?id=${created.id}`);
    },
    onError: (caught) => {
      setError(
        caught instanceof ApiError ? caught.message : "만들지 못했습니다.",
      );
    },
  });

  return (
    <>
      <PageHeader
        title="AI 계정 만들기"
        description="만든 뒤 상세 화면에서 사진을 올립니다. 성별은 나중에 바꿀 수 없습니다."
      />
      <AiMemberForm
        initial={defaultAiMemberDraft}
        genderEditable
        submitLabel="만들기"
        pending={create.isPending}
        error={error}
        onSubmit={(draft) => create.mutate(draft)}
      />
    </>
  );
}
