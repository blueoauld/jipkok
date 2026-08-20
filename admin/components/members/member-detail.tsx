"use client";

import { useState } from "react";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { DescriptionList } from "@/components/description-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PhotoGrid } from "@/components/photo-grid";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ReleaseButton } from "@/components/release-button";
import { SuspendDialog } from "@/components/suspend-dialog";
import { MemberReportTable } from "@/components/reports/member-report-table";
import { SuspensionTable } from "@/components/suspensions/suspension-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCount, formatDateTime, formatPhoneNumber } from "@/lib/format";
import {
  genderLabels,
  profileTargetLabels,
  suspensionReasonLabels,
  suspensionTypeLabels,
} from "@/lib/labels";
import {
  fetchMemberDetail,
  resetMemberProfile,
  withdrawMember,
} from "@/lib/api/members";
import { fetchMemberReports } from "@/lib/api/reports";
import { defaultMemberReportFilter } from "@/components/reports/member-report-filters";
import { QuerySection } from "@/components/query-section";
import { TablePagination } from "@/components/table-pagination";
import { usePageGuard } from "@/hooks/use-page-guard";
import type { MemberDetail as MemberDetailData } from "@/lib/types";
import type { ProfileTarget } from "@/lib/types";

const none = <span className="text-muted-foreground">없음</span>;

export function MemberDetail() {
  const id = Number(useSearchParams().get("id"));

  const {
    data: member,
    isPending,
    error,
  } = useQuery({
    queryKey: ["members", "detail", id],
    queryFn: () => fetchMemberDetail(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <>
        <PageHeader title="회원" />
        <EmptyState message="회원을 찾을 수 없습니다." />
      </>
    );
  }

  return (
    <QuerySection
      isPending={isPending}
      error={error}
      skeletonClassName="h-96 w-full"
    >
      {member && <Loaded member={member} />}
    </QuerySection>
  );
}

function Loaded({ member }: { member: MemberDetailData }) {
  const [resetTarget, setResetTarget] = useState<ProfileTarget | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const activeSuspensions = member.suspensions.filter(
    (s) => s.status === "ACTIVE",
  );
  const suspended = activeSuspensions.length > 0;

  return (
    <>
      <PageHeader title={`${member.nickname} #${member.id}`}>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              초기화
              <ChevronDown data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(profileTargetLabels) as ProfileTarget[]).map(
                (target) => (
                  <DropdownMenuItem
                    key={target}
                    onClick={() => setResetTarget(target)}
                  >
                    {profileTargetLabels[target]}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <SuspendDialog
            memberId={member.id}
            nickname={member.nickname}
            disabled={member.withdrawnAt != null}
          />
          <Button
            variant="destructive"
            disabled={member.withdrawnAt != null}
            onClick={() => setWithdrawOpen(true)}
          >
            탈퇴
          </Button>
        </div>
      </PageHeader>

      <ConfirmDialog
        open={resetTarget !== null}
        onOpenChange={(next) => {
          if (!next) setResetTarget(null);
        }}
        title="프로필 초기화"
        description={
          resetTarget
            ? `${member.nickname} #${member.id}의 ${profileTargetLabels[resetTarget]}을 초기화합니다. 되돌릴 수 없습니다.`
            : ""
        }
        confirmLabel="초기화"
        errorFallback="초기화하지 못했습니다."
        invalidateKeys={[["members"]]}
        action={() => resetMemberProfile(member.id, resetTarget!)}
      />

      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="회원 탈퇴"
        description={`${member.nickname} #${member.id}을 탈퇴 처리합니다. 되돌릴 수 없습니다.`}
        confirmLabel="탈퇴"
        errorFallback="탈퇴 처리하지 못했습니다."
        invalidateKeys={[["members"], ["dashboard"]]}
        action={() => withdrawMember(member.id)}
      />

      {suspended && (
        <Card>
          <CardHeader>
            <CardTitle>현재 정지 {activeSuspensions.length}건</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead className="w-24">유형</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead className="text-right">시작일</TableHead>
                  <TableHead className="text-right">종료일</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSuspensions.map((suspension) => (
                  <TableRow key={suspension.id}>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {suspension.id}
                    </TableCell>
                    <TableCell>
                      {suspensionTypeLabels[suspension.type]}
                    </TableCell>
                    <TableCell>
                      {suspensionReasonLabels[suspension.reason]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatDateTime(suspension.startedAt)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {suspension.expiresAt
                        ? formatDateTime(suspension.expiresAt)
                        : "영구"}
                    </TableCell>
                    <TableCell className="text-right">
                      <ReleaseButton
                        memberId={suspension.memberId}
                        type={suspension.type}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>프로필</CardTitle>
          </CardHeader>
          <CardContent>
            <DescriptionList
              items={[
                {
                  label: "전화번호",
                  value: formatPhoneNumber(member.phoneNumber),
                },
                {
                  label: "성별 / 나이",
                  value: `${genderLabels[member.gender]} / ${member.age}`,
                },
                { label: "코멘트", value: member.comment ?? none },
                { label: "자기소개", value: member.bio ?? none },
                {
                  label: "받은 좋아요",
                  value: formatCount(member.receivedLikeCount),
                },
                { label: "포인트", value: formatCount(member.pointBalance) },
                {
                  label: "쪽지 수신",
                  value: member.noteReceiveEnabled ? "O" : "X",
                },
                {
                  label: "좌표",
                  value:
                    member.latitude != null && member.longitude != null ? (
                      <a
                        href={`https://map.kakao.com/link/map/${member.latitude},${member.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="tabular-nums underline underline-offset-4"
                      >
                        {member.latitude.toFixed(5)},{" "}
                        {member.longitude.toFixed(5)}
                      </a>
                    ) : (
                      none
                    ),
                },
                { label: "가입일", value: formatDateTime(member.joinedAt) },
                {
                  label: "갱신일",
                  value: member.locatedAt
                    ? formatDateTime(member.locatedAt)
                    : none,
                },
                {
                  label: "탈퇴일",
                  value: member.withdrawnAt
                    ? formatDateTime(member.withdrawnAt)
                    : none,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>공개 사진 {member.publicPhotoUrls.length}장</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoGrid
              urls={member.publicPhotoUrls}
              emptyMessage="공개 사진이 없습니다."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>비밀 사진 {member.secretPhotoUrls.length}장</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoGrid
              urls={member.secretPhotoUrls}
              emptyMessage="비밀 사진이 없습니다."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>정지 이력 {member.suspensions.length}건</CardTitle>
        </CardHeader>
        <CardContent>
          <SuspensionTable
            suspensions={member.suspensions}
            emptyMessage="정지 이력이 없습니다."
          />
        </CardContent>
      </Card>

      <ReceivedReports phoneNumber={member.phoneNumber} />
    </>
  );
}

function ReceivedReports({ phoneNumber }: { phoneNumber: string }) {
  const [page, setPage] = useState(1);

  const { data, isPending, error } = useQuery({
    queryKey: ["reports", "by-phone", phoneNumber, page],
    queryFn: () =>
      fetchMemberReports({
        ...defaultMemberReportFilter,
        reportedPhoneNumber: phoneNumber,
        page,
      }),
  });

  usePageGuard(page, setPage, data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>받은 신고 {data ? `${data.totalCount}건` : ""}</CardTitle>
      </CardHeader>
      <CardContent>
        <QuerySection isPending={isPending} error={error}>
          {data && (
            <MemberReportTable
              reports={data.items}
              emptyMessage="받은 신고가 없습니다."
            />
          )}
        </QuerySection>
      </CardContent>
      {data && data.totalCount > data.size && (
        <CardFooter className="bg-transparent">
          <TablePagination
            page={data.page}
            size={data.size}
            totalCount={data.totalCount}
            onPageChange={setPage}
          />
        </CardFooter>
      )}
    </Card>
  );
}
