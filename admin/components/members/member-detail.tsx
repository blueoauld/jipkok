"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { DescriptionList } from "@/components/description-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PhotoGrid } from "@/components/photo-grid";
import { CursorPagination } from "@/components/cursor-pagination";
import { MessageTable } from "@/components/messages/message-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCount, formatDateTime } from "@/lib/format";
import { genderLabels, profileTargetLabels } from "@/lib/labels";
import {
  fetchMemberDetail,
  resetMemberProfile,
  withdrawMember,
} from "@/lib/api/members";
import { fetchMessages } from "@/lib/api/messages";
import { fetchMemberReports } from "@/lib/api/reports";
import { defaultMemberReportFilter } from "@/components/reports/member-report-filters";
import { QuerySection } from "@/components/query-section";
import { TablePagination } from "@/components/table-pagination";
import { useCursorPages } from "@/hooks/use-cursor-pages";
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
  const activeCount = member.suspensions.filter(
    (s) => s.status === "ACTIVE",
  ).length;

  return (
    <>
      <PageHeader title={`${member.nickname} #${member.id}`}>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/chat-rooms?memberId=${member.id}`} />}
          >
            채팅방
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" />}
              disabled={member.withdrawnAt != null}
            >
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
        invalidateKeys={[["members"], ["actions"]]}
        action={() => resetMemberProfile(member.id, resetTarget!)}
      />

      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="회원 탈퇴"
        description={`${member.nickname} #${member.id}을 탈퇴 처리합니다. 되돌릴 수 없습니다.`}
        confirmLabel="탈퇴"
        errorFallback="탈퇴 처리하지 못했습니다."
        invalidateKeys={[
          ["members"],
          ["dashboard"],
          ["feed-reports"],
          ["worry-reports"],
          ["worry-comment-reports"],
          ["actions"],
        ]}
        action={() => withdrawMember(member.id)}
      />

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
                  value: member.phoneNumber,
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
                      <Coordinates
                        label={`${member.nickname} #${member.id}`}
                        latitude={member.latitude}
                        longitude={member.longitude}
                      />
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
          <CardTitle>닉네임 이력 {member.nicknameHistories.length}건</CardTitle>
        </CardHeader>
        <CardContent>
          <NicknameHistoryList histories={member.nicknameHistories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            정지 이력 {member.suspensions.length}건
            {activeCount > 0 && `, 정지 중 ${activeCount}건`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SuspensionTable
            suspensions={member.suspensions}
            emptyMessage="정지 이력이 없습니다."
          />
        </CardContent>
      </Card>

      <ReceivedReports phoneNumber={member.phoneNumber} />

      <SentMessages phoneNumber={member.phoneNumber} />
    </>
  );
}

function Coordinates({
  label,
  latitude,
  longitude,
}: {
  label: string;
  latitude: number;
  longitude: number;
}) {
  const links = [
    {
      label: "카카오",
      href: `https://map.kakao.com/link/map/${encodeURIComponent(label)},${latitude},${longitude}`,
    },
    {
      label: "네이버",
      href: `https://map.naver.com/p/search/${latitude},${longitude}`,
    },
  ];

  return (
    <span className="flex flex-wrap items-center gap-x-3">
      <span className="tabular-nums">
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground underline underline-offset-4"
        >
          {link.label}
        </a>
      ))}
    </span>
  );
}

function NicknameHistoryList({
  histories,
}: {
  histories: MemberDetailData["nicknameHistories"];
}) {
  if (histories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">닉네임 이력이 없습니다.</p>
    );
  }

  return (
    <div className="grid w-fit grid-cols-[12rem_auto] gap-x-8 gap-y-1.5 text-sm">
      <span className="text-muted-foreground">닉네임</span>
      <span className="text-muted-foreground">변경일</span>
      {histories.map((history, index) => (
        <Fragment key={index}>
          <span>{history.nickname}</span>
          <span className="tabular-nums">
            {formatDateTime(history.changedAt)}
          </span>
        </Fragment>
      ))}
    </div>
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
    placeholderData: keepPreviousData,
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

function SentMessages({ phoneNumber }: { phoneNumber: string }) {
  const pages = useCursorPages();

  const { data, isPending, error } = useQuery({
    queryKey: ["messages", "by-phone", phoneNumber, pages.startKey],
    queryFn: () => fetchMessages({ to: phoneNumber, startKey: pages.startKey }),
    placeholderData: keepPreviousData,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>문자 발송</CardTitle>
      </CardHeader>
      <CardContent>
        <QuerySection isPending={isPending} error={error}>
          {data && (
            <MessageTable
              messages={data.items}
              emptyMessage="보낸 문자가 없습니다."
            />
          )}
        </QuerySection>
      </CardContent>
      {data && (pages.hasPrevious || data.nextKey != null) && (
        <CardFooter className="bg-transparent">
          <CursorPagination
            hasPrevious={pages.hasPrevious}
            hasNext={data.nextKey != null}
            onPrevious={pages.previous}
            onNext={() => data.nextKey && pages.next(data.nextKey)}
          />
        </CardFooter>
      )}
    </Card>
  );
}
