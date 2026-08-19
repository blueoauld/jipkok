"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DescriptionList } from "@/components/description-list";
import { EmptyState } from "@/components/empty-state";
import { MemberCell } from "@/components/member-cell";
import { PageHeader } from "@/components/page-header";
import { PhotoGrid } from "@/components/photo-grid";
import { StatusText } from "@/components/status-text";
import { ChatTranscript } from "@/components/reports/chat-transcript";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatPhoneNumber } from "@/lib/format";
import {
  genderLabels,
  reportReasonLabels,
  reportTypeLabels,
} from "@/lib/labels";
import { findMemberReportDetail } from "@/lib/mock/member-report-details";

export function MemberReportDetail() {
  const id = Number(useSearchParams().get("id"));
  const report = Number.isInteger(id) ? findMemberReportDetail(id) : null;

  if (!report) {
    return (
      <>
        <PageHeader title="회원 신고" />
        <EmptyState message="신고를 찾을 수 없습니다." />
      </>
    );
  }

  const { reported } = report;

  return (
    <>
      <PageHeader
        title={`신고 #${report.id}`}
        description={`${reportTypeLabels[report.type]} 신고, ${reportReasonLabels[report.reason]}`}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline">정지</Button>
          <Button disabled={report.handledAt !== null}>
            {report.handledAt ? "처리됨" : "처리 완료"}
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
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
                  reporterId={report.reporter.id}
                  reporterNickname={report.reporter.nickname}
                  reportedNickname={reported.nickname}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
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
                    value: formatPhoneNumber(reported.phoneNumber),
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
