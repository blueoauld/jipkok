import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AiMemberList } from "@/components/ai-members/ai-member-list";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function AiMembersPage() {
  return (
    <>
      <PageHeader
        title="AI 계정"
        description="앱에서는 일반 회원과 똑같이 보이고, 쪽지를 받으면 페르소나대로 대화합니다."
      >
        <Button nativeButton={false} render={<Link href="/ai-members/new" />}>
          <Plus data-icon="inline-start" />
          만들기
        </Button>
      </PageHeader>
      <Suspense>
        <AiMemberList />
      </Suspense>
    </>
  );
}
