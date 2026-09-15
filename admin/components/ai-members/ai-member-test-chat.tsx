"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FilterSelect } from "@/components/filter-select";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { testAiChat } from "@/lib/api/ai-members";
import { ApiError } from "@/lib/api/client";
import { formatCount } from "@/lib/format";
import { memberLocaleLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type {
  AiTestChatMessage,
  AiTestChatReply,
  MemberLocale,
} from "@/lib/types";

const MAX_MESSAGES = 30;

type Props = {
  memberId: number;
  nickname: string;
  systemPrompt: string;
};

export function AiMemberTestChat({ memberId, nickname, systemPrompt }: Props) {
  const [locale, setLocale] = useState<MemberLocale>("KO");
  const [messages, setMessages] = useState<AiTestChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [lastReply, setLastReply] = useState<AiTestChatReply | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: (next: AiTestChatMessage[]) =>
      testAiChat(memberId, { systemPrompt, locale, messages: next }),
    onSuccess: (reply, next) => {
      setMessages([...next, { role: "AI", content: reply.content }]);
      setLastReply(reply);
      setError(null);
    },
    onError: (caught) => {
      setError(
        caught instanceof ApiError ? caught.message : "답을 받지 못했습니다.",
      );
    },
  });

  const submit = () => {
    const content = input.trim();
    if (!content || send.isPending) return;
    const next = [...messages, { role: "USER" as const, content }];
    setMessages(next);
    setInput("");
    send.mutate(next);
  };

  const reset = () => {
    setMessages([]);
    setLastReply(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>테스트 대화</CardTitle>
        <CardDescription>
          폼에 적힌 프롬프트로 답하고, 저장하지 않으며 한도에도 세지 않습니다.
          상대는 30세 이성 &quot;테스터&quot;입니다.
        </CardDescription>
        <FilterSelect
          items={memberLocaleLabels}
          value={locale}
          onChange={setLocale}
        />
      </CardHeader>
      <CardContent>
        <div className="flex max-h-96 min-h-40 flex-col gap-2 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              메시지를 보내 대화를 시작합니다.
            </p>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                message.role === "AI"
                  ? "self-start bg-muted"
                  : "self-end bg-primary text-primary-foreground",
              )}
            >
              {message.role === "AI" && (
                <span className="mb-0.5 block text-xs text-muted-foreground">
                  {nickname}
                </span>
              )}
              {message.content}
            </div>
          ))}
          {send.isPending && (
            <p className="text-xs text-muted-foreground">답을 만드는 중</p>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 bg-transparent">
        <div className="flex w-full gap-2">
          <Input
            placeholder="테스터가 보낼 말"
            value={input}
            maxLength={1000}
            disabled={messages.length >= MAX_MESSAGES}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <PendingButton
            pending={send.isPending}
            disabled={!input.trim() || messages.length >= MAX_MESSAGES}
            onClick={submit}
          >
            보내기
          </PendingButton>
          <Button
            variant="outline"
            disabled={messages.length === 0 || send.isPending}
            onClick={reset}
          >
            초기화
          </Button>
        </div>
        <p className="w-full text-xs text-muted-foreground">
          {lastReply
            ? `마지막 답: 입력 ${formatCount(lastReply.promptTokens)} 토큰, 출력 ${formatCount(lastReply.completionTokens)} 토큰, 캐시 ${formatCount(lastReply.cachedTokens)} 토큰${lastReply.model ? `, ${lastReply.model}` : ""}`
            : "메시지는 30개까지 이어집니다."}
        </p>
      </CardFooter>
    </Card>
  );
}
