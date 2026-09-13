"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReportSyncStatus } from "@/components/apple-ads/report-sync-status";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PendingButton } from "@/components/pending-button";
import { QuerySection } from "@/components/query-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  fetchAppleAdsAutomation,
  runAppleAdsAutomation,
  updateAppleAdsAutomation,
} from "@/lib/api/apple-ads";
import { ApiError } from "@/lib/api/client";
import { formatCount, formatDateTime } from "@/lib/format";
import { recommendationTypeLabels } from "@/lib/labels";
import type {
  AppleAdsAutomation,
  AppleAdsAutomationRun,
  UpdateAppleAdsAutomationBody,
} from "@/lib/types";

const MAX_DAILY_LIMIT = 50;

type AutomationDraft = {
  enabled: boolean;
  dailyLimit: number;
  pauseKeyword: boolean;
  addNegativeKeyword: boolean;
  lowerBid: boolean;
  raiseBid: boolean;
  addKeyword: boolean;
  maxBid: string;
};

type TypeKey = keyof Omit<AutomationDraft, "enabled" | "dailyLimit" | "maxBid">;

const typeFields: { key: TypeKey; label: string; note: string }[] = [
  {
    key: "pauseKeyword",
    label: recommendationTypeLabels.PAUSE_KEYWORD,
    note: "탭 20회 이상, 설치 0인 활성 키워드",
  },
  {
    key: "addNegativeKeyword",
    label: recommendationTypeLabels.ADD_NEGATIVE_KEYWORD,
    note: "탭 10회 이상, 설치 0인 Search Match 검색어",
  },
  {
    key: "lowerBid",
    label: recommendationTypeLabels.LOWER_BID,
    note: "탭 10회 이상이고, 설치가 없거나 설치당 비용이 다른 키워드의 1.5배 이상이면 15% 낮춤",
  },
  {
    key: "raiseBid",
    label: recommendationTypeLabels.RAISE_BID,
    note: "설치 3회 이상, 설치당 비용이 다른 키워드의 70% 이하면 15% 올림(애플 제안 입찰가가 더 높으면 그 값까지)",
  },
  {
    key: "addKeyword",
    label: recommendationTypeLabels.ADD_KEYWORD,
    note: "설치 2회 이상 나온 Search Match 검색어를 정확 일치 키워드로 추가",
  },
];

function draftOf(settings: AppleAdsAutomation): AutomationDraft {
  return {
    enabled: settings.enabled,
    dailyLimit: settings.dailyLimit,
    pauseKeyword: settings.pauseKeyword,
    addNegativeKeyword: settings.addNegativeKeyword,
    lowerBid: settings.lowerBid,
    raiseBid: settings.raiseBid,
    addKeyword: settings.addKeyword,
    maxBid: settings.maxBid != null ? String(settings.maxBid) : "",
  };
}

function bodyOf(draft: AutomationDraft): UpdateAppleAdsAutomationBody {
  return {
    ...draft,
    maxBid: draft.maxBid === "" ? null : Number(draft.maxBid),
  };
}

export function AutomationSettings() {
  const settings = useQuery({
    queryKey: ["apple-ads", "automation"],
    queryFn: fetchAppleAdsAutomation,
  });

  return (
    <QuerySection
      isPending={settings.isPending}
      error={settings.error}
      skeletonClassName="h-96 w-full"
    >
      {settings.data && (
        <AutomationForm
          key={settings.data.updatedAt}
          settings={settings.data}
        />
      )}
    </QuerySection>
  );
}

type FormProps = {
  settings: AppleAdsAutomation;
};

function AutomationForm({ settings }: FormProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => draftOf(settings));
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(settings));

  const save = useMutation({
    mutationFn: (body: AutomationDraft) =>
      updateAppleAdsAutomation(bodyOf(body)),
    onSuccess: (saved) => {
      queryClient.setQueryData(["apple-ads", "automation"], saved);
      toast.success("자동 실행 설정을 저장했습니다.");
    },
    onError: (caught) => {
      toast.error(
        caught instanceof ApiError ? caught.message : "저장하지 못했습니다.",
      );
    },
  });

  const [runOpen, setRunOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>자동 실행</CardTitle>
        <CardDescription>
          매일 06시 리포트 적재가 끝나면 3일 전까지의 30일 성과로 추천을 만들고,
          허용한 유형만 하루 한도까지 애플 광고에 바로 적용합니다. 적용한 조치는
          조치 이력에 자동으로 표시되고 되돌릴 수 있습니다.
        </CardDescription>
        <ReportSyncStatus />
      </CardHeader>
      <CardContent className="space-y-6">
        <label className="flex items-center gap-3">
          <Switch
            checked={draft.enabled}
            onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
          />
          <span className="font-medium">{draft.enabled ? "켜짐" : "꺼짐"}</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-sm">하루 최대</span>
          <Input
            type="number"
            min={0}
            max={MAX_DAILY_LIMIT}
            className="w-20"
            value={draft.dailyLimit}
            onChange={(event) =>
              setDraft({
                ...draft,
                dailyLimit: Math.min(
                  MAX_DAILY_LIMIT,
                  Math.max(0, Number(event.target.value) || 0),
                ),
              })
            }
          />
          <span className="text-sm">건</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-sm">올리기 최대 입찰가</span>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              className="w-28"
              placeholder="제한 없음"
              value={draft.maxBid}
              onChange={(event) =>
                setDraft({ ...draft, maxBid: event.target.value })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            자동으로 입찰가를 올릴 때 이 값을 넘지 않고, 이미 이 값에 닿은
            키워드는 건너뜁니다. 계정 통화 기준이고, 비우면 제한이 없습니다.
          </p>
        </div>
        <div className="space-y-3">
          {typeFields.map((field) => (
            <label key={field.key} className="flex items-start gap-3">
              <Checkbox
                className="mt-0.5"
                checked={draft[field.key]}
                onCheckedChange={(checked) =>
                  setDraft({ ...draft, [field.key]: checked === true })
                }
              />
              <span>
                <span className="text-sm font-medium">{field.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {field.note}
                </span>
              </span>
            </label>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 bg-transparent">
        <p className="text-sm text-muted-foreground">
          {settings.updatedByNickname
            ? `${settings.updatedByNickname}이(가) ${formatDateTime(settings.updatedAt)}에 바꿈`
            : "아직 바꾼 적 없음"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={dirty}
            onClick={() => setRunOpen(true)}
          >
            지금 실행
          </Button>
          <PendingButton
            pending={save.isPending}
            disabled={!dirty}
            onClick={() => save.mutate(draft)}
          >
            저장
          </PendingButton>
        </div>
      </CardFooter>
      <ConfirmDialog
        open={runOpen}
        onOpenChange={setRunOpen}
        title="자동 실행 지금 돌리기"
        description="저장된 설정으로 지금 추천을 만들고, 허용한 유형을 오늘 남은 한도만큼 애플 광고에 바로 적용합니다. 적용한 조치는 조치 이력에서 하나씩 되돌릴 수 있습니다."
        confirmLabel="실행"
        confirmVariant="default"
        errorFallback="실행하지 못했습니다."
        invalidateKeys={[["apple-ads"]]}
        action={runAppleAdsAutomation}
        onSuccess={notifyRun}
      />
    </Card>
  );
}

function notifyRun(result: AppleAdsAutomationRun) {
  if (!result.enabled) {
    toast.info("자동 실행이 꺼져 있어 아무것도 하지 않았습니다.");
    return;
  }

  if (result.remaining === 0) {
    toast.info("오늘 남은 자동 적용 한도가 없어 아무것도 하지 않았습니다.");
    return;
  }

  const summary = `후보 ${formatCount(result.candidates)}건 중 ${formatCount(result.applied)}건을 적용했습니다.`;

  if (result.failed > 0) {
    toast.warning(
      `${summary} ${formatCount(result.failed)}건은 실패해서 서버 로그에 남겼습니다.`,
    );
    return;
  }

  toast.success(summary);
}
