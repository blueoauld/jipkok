import { Suspense } from "react";
import { DiaryDetail } from "@/components/diaries/diary-detail";

export default function DiaryDetailPage() {
  return (
    <Suspense>
      <DiaryDetail />
    </Suspense>
  );
}
