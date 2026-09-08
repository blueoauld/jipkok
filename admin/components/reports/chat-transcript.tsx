import Image from "next/image";
import { ImageOff, Video } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { chatMessageTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { ChatMessageSnapshot } from "@/lib/types";

type Props = {
  messages: ChatMessageSnapshot[];
  leftMemberId: number;
  leftNickname: string;
  rightNickname: string;
};

export function ChatTranscript({
  messages,
  leftMemberId,
  leftNickname,
  rightNickname,
}: Props) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">대화 내역이 없습니다.</p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {messages.map((message) => {
        const left = message.senderId === leftMemberId;
        return (
          <li
            key={message.id}
            className={cn(
              "flex flex-col gap-1",
              left ? "items-start" : "items-end",
            )}
          >
            <span className="text-xs text-muted-foreground">
              {left ? leftNickname : rightNickname}
            </span>
            <div
              className={cn(
                "flex items-end gap-2",
                !left && "flex-row-reverse",
              )}
            >
              <Bubble message={message} left={left} />
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
  left,
}: {
  message: ChatMessageSnapshot;
  left: boolean;
}) {
  const base = cn(
    "max-w-md px-3 py-2 text-sm break-words whitespace-pre-wrap",
    left
      ? "bg-neutral-100 dark:bg-neutral-800"
      : "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
  );

  if (message.type === "TEXT") {
    return <div className={base}>{message.content}</div>;
  }

  const href = message.type === "VIDEO" ? message.videoUrl : message.photoUrl;
  const media = message.photoUrl ? (
    <span className="relative inline-block">
      <Image
        src={message.photoUrl}
        alt=""
        width={240}
        height={240}
        className="max-h-60 w-auto object-cover"
      />
      {message.type === "VIDEO" && (
        <Video className="absolute right-2 bottom-2 size-5 text-white drop-shadow" />
      )}
    </span>
  ) : (
    <div className={cn(base, "flex items-center gap-1.5")}>
      {message.type === "PHOTO" ? (
        <ImageOff className="size-4" />
      ) : (
        <Video className="size-4" />
      )}
      {chatMessageTypeLabels[message.type]}
    </div>
  );

  if (!href) return media;

  return (
    <a href={href} target="_blank" rel="noreferrer">
      {media}
    </a>
  );
}
