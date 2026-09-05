import { Suspense } from "react";
import { MemberList } from "@/components/members/member-list";
import { PageHeader } from "@/components/page-header";

export default function MembersPage() {
  return (
    <>
      <PageHeader
        title="회원"
        description="회원을 조회하고 정지, 초기화, 탈퇴를 처리합니다."
      />
      <Suspense>
        <MemberList />
      </Suspense>
    </>
  );
}
