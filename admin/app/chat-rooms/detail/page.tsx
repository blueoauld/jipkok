import { Suspense } from "react";
import { ChatRoomDetail } from "@/components/chat-rooms/chat-room-detail";

export default function ChatRoomDetailPage() {
  return (
    <Suspense>
      <ChatRoomDetail />
    </Suspense>
  );
}
