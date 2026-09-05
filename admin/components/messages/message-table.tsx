import { StatusText, type StatusTone } from "@/components/status-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { smsStatusLabels } from "@/lib/labels";
import type { SmsMessage, SmsMessageStatus } from "@/lib/types";

const statusTones: Record<SmsMessageStatus, StatusTone> = {
  PENDING: "muted",
  SENDING: "muted",
  COMPLETE: "positive",
  FAILED: "negative",
};

const dash = <span className="text-muted-foreground">-</span>;

type Props = {
  emptyMessage?: string;
  messages: SmsMessage[];
};

export function MessageTable({
  messages,
  emptyMessage = "조건에 맞는 문자가 없습니다.",
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>수신번호</TableHead>
          <TableHead>내용</TableHead>
          <TableHead className="w-16">유형</TableHead>
          <TableHead className="w-20">상태</TableHead>
          <TableHead className="w-16">코드</TableHead>
          <TableHead className="text-right">접수일</TableHead>
          <TableHead className="text-right">수신일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {messages.map((message) => (
          <TableRow key={message.messageId}>
            <TableCell className="tabular-nums">{message.to}</TableCell>
            <TableCell
              className="max-w-md truncate"
              title={message.text ?? undefined}
            >
              {message.text ?? dash}
            </TableCell>
            <TableCell>{message.type ?? dash}</TableCell>
            <TableCell>
              {message.status ? (
                <StatusText tone={statusTones[message.status]}>
                  {smsStatusLabels[message.status]}
                </StatusText>
              ) : (
                dash
              )}
            </TableCell>
            <TableCell className="tabular-nums text-muted-foreground">
              {message.statusCode ?? dash}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {message.createdAt ? formatDateTime(message.createdAt) : dash}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {message.receivedAt ? formatDateTime(message.receivedAt) : dash}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
