"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  draftOf,
  updateBodyOf,
  type AiMemberDraft,
} from "@/components/ai-members/ai-member-draft";
import { AiMemberForm } from "@/components/ai-members/ai-member-form";
import { AiMemberPhotos } from "@/components/ai-members/ai-member-photos";
import { AiMemberStats } from "@/components/ai-members/ai-member-stats";
import { AiMemberTestChat } from "@/components/ai-members/ai-member-test-chat";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { QuerySection } from "@/components/query-section";
import { Button } from "@/components/ui/button";
import {
  fetchAiMemberDetail,
  updateAiMember,
  withdrawAiMember,
} from "@/lib/api/ai-members";
import { ApiError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { AiMemberDetail as AiMemberDetailData } from "@/lib/types";

export function AiMemberDetail() {
  const id = Number(useSearchParams().get("id"));

  const {
    data: member,
    isPending,
    error,
  } = useQuery({
    queryKey: ["ai-members", "detail", id],
    queryFn: () => fetchAiMemberDetail(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <>
        <PageHeader title="AI 계정" />
        <EmptyState message="AI 계정을 찾을 수 없습니다." />
      </>
    );
  }

  return (
    <QuerySection
      isPending={isPending}
      error={error}
      skeletonClassName="h-96 w-full"
    >
      {member && <Loaded member={member} />}
    </QuerySection>
  );
}

function Loaded({ member }: { member: AiMemberDetailData }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftPrompt, setDraftPrompt] = useState(member.persona.systemPrompt);

  const save = useMutation({
    mutationFn: (draft: AiMemberDraft) =>
      updateAiMember(member.id, updateBodyOf(draft)),
    onSuccess: (saved) => {
      setError(null);
      queryClient.setQueryData(["ai-members", "detail", member.id], saved);
      queryClient.invalidateQueries({ queryKey: ["ai-members"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      toast.success("AI 계정을 저장했습니다.");
    },
    onError: (caught) => {
      setError(
        caught instanceof ApiError ? caught.message : "저장하지 못했습니다.",
      );
    },
  });

  return (
    <>
      <PageHeader
        title={`${member.nickname} #${member.id}`}
        description={`생성 ${formatDateTime(member.createdAt)}, 위치 갱신 ${
          member.locatedAt ? formatDateTime(member.locatedAt) : "없음"
        }, 다음 갱신 ${formatDateTime(member.persona.nextLocationRefreshAt)}`}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/members/detail?id=${member.id}`} />}
          >
            회원 상세
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/chat-rooms?memberId=${member.id}`} />}
          >
            채팅방
          </Button>
          <Button variant="destructive" onClick={() => setWithdrawOpen(true)}>
            삭제
          </Button>
        </div>
      </PageHeader>

      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="AI 계정 삭제"
        description={`${member.nickname} #${member.id}을 회원 탈퇴와 같은 절차로 삭제합니다. 상대방 채팅방에는 탈퇴한 회원으로 남습니다. 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        errorFallback="삭제하지 못했습니다."
        invalidateKeys={[
          ["ai-members"],
          ["members"],
          ["dashboard"],
          ["actions"],
        ]}
        action={() => withdrawAiMember(member.id)}
        onSuccess={() => router.replace("/ai-members")}
      />

      <AiMemberForm
        key={member.updatedAt}
        initial={draftOf(member)}
        genderEditable={false}
        submitLabel="저장"
        pending={save.isPending}
        error={error}
        onSubmit={(draft) => save.mutate(draft)}
        onChange={(draft) => setDraftPrompt(draft.systemPrompt)}
      />

      <AiMemberPhotos
        memberId={member.id}
        publicPhotos={member.publicPhotos}
        secretPhotos={member.secretPhotos}
      />

      <div className="grid grid-cols-1 items-start gap-4 md:gap-6 lg:grid-cols-2">
        <AiMemberStats today={member.today} total={member.total} />
        <AiMemberTestChat
          memberId={member.id}
          nickname={member.nickname}
          systemPrompt={draftPrompt}
        />
      </div>
    </>
  );
}
