import Image from "next/image";
import { ImageOff, Video } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessageSnapshot } from "@/lib/types";

type Props = {
  messages: ChatMessageSnapshot[];
  reporterId: number;
  reporterNickname: string;
  reportedNickname: string;
};

export function ChatTranscript({
  messages,
  reporterId,
  reporterNickname,
  reportedNickname,
}: Props) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">대화 내역이 없습니다.</p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {messages.map((message) => {
        const mine = message.senderId === reporterId;
        return (
          <li
            key={message.id}
            className={cn(
              "flex flex-col gap-1",
              mine ? "items-start" : "items-end",
            )}
          >
            <span className="text-xs text-muted-foreground">
              {mine ? reporterNickname : reportedNickname}
            </span>
            <div
              className={cn(
                "flex items-end gap-2",
                !mine && "flex-row-reverse",
              )}
            >
              <Bubble message={message} mine={mine} />
              <time className="text-xs text-muted-foreground tabular-nums">
                {formatDateTime(message.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Bubble({
  message,
  mine,
}: {
  message: ChatMessageSnapshot;
  mine: boolean;
}) {
  const base = cn(
    "max-w-md px-3 py-2 text-sm break-words whitespace-pre-wrap",
    mine
      ? "bg-neutral-100 dark:bg-neutral-800"
      : "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
  );

  if (message.type === "TEXT") {
    return <div className={base}>{message.content}</div>;
  }

  if (message.type === "PHOTO" && message.photoUrl) {
    return (
      <a href={message.photoUrl} target="_blank" rel="noreferrer">
        <Image
          src={message.photoUrl}
          alt=""
          width={240}
          height={240}
          className="max-h-60 w-auto object-cover"
        />
      </a>
    );
  }

  return (
    <div className={cn(base, "flex items-center gap-1.5")}>
      {message.type === "PHOTO" ? (
        <ImageOff className="size-4" />
      ) : (
        <Video className="size-4" />
      )}
      {message.type === "PHOTO" ? "사진" : "동영상"}
    </div>
  );
}
