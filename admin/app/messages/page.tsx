import { Suspense } from "react";
import { MessageList } from "@/components/messages/message-list";
import { PageHeader } from "@/components/page-header";

export default function MessagesPage() {
  return (
    <>
      <PageHeader
        title="문자 발송"
        description="솔라피로 보낸 인증번호 문자의 발송 결과를 확인합니다."
      />
      <Suspense>
        <MessageList />
      </Suspense>
    </>
  );
}
