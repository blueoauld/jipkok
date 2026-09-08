import { Suspense } from "react";
import { ChatRoomList } from "@/components/chat-rooms/chat-room-list";
import { PageHeader } from "@/components/page-header";

export default function ChatRoomsPage() {
  return (
    <>
      <PageHeader
        title="채팅방"
        description="채팅방 목록을 조회하고 대화 내역을 봅니다."
      />
      <Suspense>
        <ChatRoomList />
      </Suspense>
    </>
  );
}
