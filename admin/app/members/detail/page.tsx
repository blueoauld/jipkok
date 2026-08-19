import { Suspense } from "react";
import { MemberDetail } from "@/components/members/member-detail";

export default function MemberDetailPage() {
  return (
    <Suspense>
      <MemberDetail />
    </Suspense>
  );
}
