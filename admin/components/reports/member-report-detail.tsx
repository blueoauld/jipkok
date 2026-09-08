"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DescriptionList } from "@/components/description-list";
import { EmptyState } from "@/components/empty-state";
import { MemberCell } from "@/components/member-cell";
import { PageHeader } from "@/components/page-header";
import { PhotoGrid } from "@/components/photo-grid";
import { StatusText } from "@/components/status-text";
import { ChatTranscript } from "@/components/reports/chat-transcript";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { MemberReportDetail as MemberReportDetailData } from "@/lib/types";
import {
  genderLabels,
  reportReasonLabels,
  reportTypeLabels,
} from "@/lib/labels";
import { fetchMemberReportDetail, handleMemberReport } from "@/lib/api/reports";
import { ApiError } from "@/lib/api/client";
import { QuerySection } from "@/components/query-section";
import { SuspendDialog } from "@/components/suspend-dialog";

export function MemberReportDetail() {
  const id = Number(useSearchParams().get("id"));
  const queryClient = useQueryClient();

  const {
    data: report,
    isPending,
    error,
  } = useQuery({
    queryKey: ["reports", "detail", id],
    queryFn: () => fetchMemberReportDetail(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  const handleMutation = useMutation({
    mutationFn: () => handleMemberReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
    onError: (caught) => {
      toast.error(
        caught instanceof ApiError ? caught.message : "처리하지 못했습니다.",
      );
    },
  });

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <>
        <PageHeader title="회원 신고" />
        <EmptyState message="신고를 찾을 수 없습니다." />
      </>
    );
  }

  return (
    <QuerySection
      isPending={isPending}
      error={error}
      skeletonClassName="h-96 w-full"
    >
      {report && (
        <Loaded
          report={report}
          handling={handleMutation.isPending}
          onHandle={() => handleMutation.mutate()}
        />
      )}
    </QuerySection>
  );
}

type LoadedProps = {
  report: MemberReportDetailData;
  handling: boolean;
  onHandle: () => void;
};

function Loaded({ report, handling, onHandle }: LoadedProps) {
  const { reported } = report;

  return (
    <>
      <PageHeader
        title={`신고 #${report.id}`}
        description={`${reportTypeLabels[report.type]} 신고, ${reportReasonLabels[report.reason]}`}
      >
        <div className="flex items-center gap-2">
          <SuspendDialog memberId={reported.id} nickname={reported.nickname} />
          <PendingButton
            pending={handling}
            disabled={report.handledAt != null}
            onClick={onHandle}
          >
            {report.handledAt ? "처리됨" : "처리 완료"}
          </PendingButton>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 md:gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>신고 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <DescriptionList
                items={[
                  { label: "종류", value: reportTypeLabels[report.type] },
                  { label: "사유", value: reportReasonLabels[report.reason] },
                  {
                    label: "상태",
                    value: report.handledAt ? (
                      <StatusText tone="positive">처리</StatusText>
                    ) : (
                      <StatusText tone="negative">미처리</StatusText>
                    ),
                  },
                  {
                    label: "신고자",
                    value: (
                      <MemberCell
                        id={report.reporter.id}
                        nickname={report.reporter.nickname}
                      />
                    ),
                  },
                  { label: "접수일", value: formatDateTime(report.createdAt) },
                  {
                    label: "처리일",
                    value: report.handledAt
                      ? formatDateTime(report.handledAt)
                      : "-",
                  },
                  {
                    label: "상세",
                    value: report.detail ?? (
                      <span className="text-muted-foreground">없음</span>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                증거 사진 {report.evidencePhotoUrls.length}장
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoGrid
                urls={report.evidencePhotoUrls}
                emptyMessage="첨부된 사진이 없습니다."
              />
            </CardContent>
          </Card>

          {report.type === "CHAT" && (
            <Card>
              <CardHeader>
                <CardTitle>대화 {report.messages.length}건</CardTitle>
              </CardHeader>
              <CardContent>
                <ChatTranscript
                  messages={report.messages}
                  leftMemberId={report.reporter.id}
                  leftNickname={report.reporter.nickname}
                  rightNickname={reported.nickname}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>피신고자</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <DescriptionList
                items={[
                  {
                    label: "회원",
                    value: (
                      <MemberCell
                        id={reported.id}
                        nickname={reported.nickname}
                      />
                    ),
                  },
                  {
                    label: "전화번호",
                    value: reported.phoneNumber,
                  },
                  {
                    label: "성별 / 나이",
                    value: `${genderLabels[reported.gender]} / ${reported.age}`,
                  },
                  {
                    label: "코멘트",
                    value: reported.comment ?? (
                      <span className="text-muted-foreground">없음</span>
                    ),
                  },
                  {
                    label: "자기소개",
                    value: reported.bio ?? (
                      <span className="text-muted-foreground">없음</span>
                    ),
                  },
                ]}
              />
              <Button
                variant="outline"
                className="self-start"
                nativeButton={false}
                render={<Link href={`/members/detail?id=${reported.id}`} />}
              >
                회원 상세
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                신고 시점 프로필 사진 {reported.profilePhotoUrls.length}장
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoGrid
                urls={reported.profilePhotoUrls}
                emptyMessage="프로필 사진이 없습니다."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
