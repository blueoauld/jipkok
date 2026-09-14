import { Suspense } from "react";
import { AiMemberDetail } from "@/components/ai-members/ai-member-detail";

export default function AiMemberDetailPage() {
  return (
    <Suspense>
      <AiMemberDetail />
    </Suspense>
  );
}
