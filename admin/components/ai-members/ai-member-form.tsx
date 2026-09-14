"use client";

import { useState } from "react";
import { FilterSelect } from "@/components/filter-select";
import { PendingButton } from "@/components/pending-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  isDraftComplete,
  type AiMemberDraft,
} from "@/components/ai-members/ai-member-draft";
import { genderLabels } from "@/lib/labels";

const NICKNAME_MAX_LENGTH = 10;
const COMMENT_MAX_LENGTH = 100;
const BIO_MAX_LENGTH = 1000;
const SYSTEM_PROMPT_MAX_LENGTH = 4000;
const REPLY_DELAY_MAX_SECONDS = 3600;
const LAST_HOUR = 23;
const DAILY_REPLY_LIMIT_MAX = 10000;

type Props = {
  initial: AiMemberDraft;
  genderEditable: boolean;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (draft: AiMemberDraft) => void;
  onChange?: (draft: AiMemberDraft) => void;
};

export function AiMemberForm({
  initial,
  genderEditable,
  submitLabel,
  pending,
  error,
  onSubmit,
  onChange,
}: Props) {
  const [draft, setDraft] = useState(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const patch = (next: Partial<AiMemberDraft>) => {
    const merged = { ...draft, ...next };
    setDraft(merged);
    onChange?.(merged);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>프로필</CardTitle>
          <CardDescription>
            앱에서 일반 회원과 똑같이 보이는 항목입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="닉네임">
            <Input
              maxLength={NICKNAME_MAX_LENGTH}
              value={draft.nickname}
              onChange={(event) => patch({ nickname: event.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="성별">
              {genderEditable ? (
                <FilterSelect
                  items={genderLabels}
                  value={draft.gender}
                  onChange={(gender) => patch({ gender })}
                />
              ) : (
                <p className="py-2 text-sm">{genderLabels[draft.gender]}</p>
              )}
            </Field>
            <Field label="출생 연도">
              <Input
                type="number"
                value={draft.birthYear}
                onChange={(event) => patch({ birthYear: event.target.value })}
              />
            </Field>
          </div>
          <Field label="코멘트">
            <Input
              maxLength={COMMENT_MAX_LENGTH}
              value={draft.comment}
              onChange={(event) => patch({ comment: event.target.value })}
            />
          </Field>
          <Field label="자기소개">
            <Textarea
              maxLength={BIO_MAX_LENGTH}
              value={draft.bio}
              onChange={(event) => patch({ bio: event.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="위도">
              <Input
                type="number"
                step="any"
                min={-90}
                max={90}
                value={draft.latitude}
                onChange={(event) => patch({ latitude: event.target.value })}
              />
            </Field>
            <Field label="경도">
              <Input
                type="number"
                step="any"
                min={-180}
                max={180}
                value={draft.longitude}
                onChange={(event) => patch({ longitude: event.target.value })}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            좌표는 고정이고, 활동 시간 중 20분에서 3시간 간격으로 위치 갱신
            시각만 새로 찍혀 목록 위쪽에 남습니다.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>페르소나</CardTitle>
          <CardDescription>
            대화 응답과 활동 위장에 쓰는 설정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3">
            <Switch
              checked={draft.enabled}
              onCheckedChange={(enabled) => patch({ enabled })}
            />
            <span className="text-sm font-medium">
              {draft.enabled ? "활성" : "비활성"}
            </span>
          </label>
          <Field label="시스템 프롬프트">
            <Textarea
              className="min-h-48"
              maxLength={SYSTEM_PROMPT_MAX_LENGTH}
              placeholder="성격, 말투, 관심사, 대화 스타일을 자유롭게 적습니다."
              value={draft.systemPrompt}
              onChange={(event) => patch({ systemPrompt: event.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="응답 지연 최소 (초)">
              <Input
                type="number"
                min={0}
                max={REPLY_DELAY_MAX_SECONDS}
                value={draft.replyDelayMinSeconds}
                onChange={(event) =>
                  patch({ replyDelayMinSeconds: event.target.value })
                }
              />
            </Field>
            <Field label="응답 지연 최대 (초)">
              <Input
                type="number"
                min={0}
                max={REPLY_DELAY_MAX_SECONDS}
                value={draft.replyDelayMaxSeconds}
                onChange={(event) =>
                  patch({ replyDelayMaxSeconds: event.target.value })
                }
              />
            </Field>
            <Field label="활동 시작 (시, 한국)">
              <Input
                type="number"
                min={0}
                max={LAST_HOUR}
                value={draft.activeStartHour}
                onChange={(event) =>
                  patch({ activeStartHour: event.target.value })
                }
              />
            </Field>
            <Field label="활동 끝 (시, 한국)">
              <Input
                type="number"
                min={0}
                max={LAST_HOUR}
                value={draft.activeEndHour}
                onChange={(event) =>
                  patch({ activeEndHour: event.target.value })
                }
              />
            </Field>
            <Field label="하루 응답 한도">
              <Input
                type="number"
                min={0}
                max={DAILY_REPLY_LIMIT_MAX}
                value={draft.dailyReplyLimit}
                onChange={(event) =>
                  patch({ dailyReplyLimit: event.target.value })
                }
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            활동 끝이 시작보다 작으면 자정을 넘겨 다음 날까지 활동합니다. 둘이
            같으면 하루 종일 활동합니다.
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2 bg-transparent">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <PendingButton
            pending={pending}
            disabled={!dirty || !isDraftComplete(draft)}
            onClick={() => onSubmit(draft)}
          >
            {submitLabel}
          </PendingButton>
        </CardFooter>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
