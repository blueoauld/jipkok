package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.response.ReportDetail
import com.blueoauld.server.domain.report.service.ReportService
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent
import net.dv8tion.jda.api.utils.FileUpload
import org.springframework.stereotype.Component

@Component
class ReportCommandHandler(

    private val reportService: ReportService,
) : AdminCommandHandler {

    override fun supports(name: String) = name in COMMAND_NAMES

    override fun handle(event: SlashCommandInteractionEvent): AdminReply = when (event.name) {
        AdminCommands.REPORTS -> reports()
        AdminCommands.HANDLE -> markHandled(event)
        else -> report(event)
    }

    private fun reports(): AdminReply {
        val pending = reportService.findPending()

        if (pending.isEmpty()) {
            return AdminReply.Text(NO_PENDING_MESSAGE)
        }

        val body = pending.joinToString("\n") {
            "`${it.reportId}` ${DiscordEmbeds.format(it.reportedAt)} / ${it.type.label} / ${it.reason.label}" +
                " / 피신고자 `${it.reportedMemberId}`"
        }

        return AdminReply.of(PENDING_TITLE, body)
    }

    private fun markHandled(event: SlashCommandInteractionEvent): AdminReply {
        val reportId = event.getOption(AdminCommands.REPORT_ID_OPTION)!!.asLong

        reportService.handle(reportId)

        return AdminReply.Text("신고 `$reportId` 처리 완료")
    }

    private fun report(event: SlashCommandInteractionEvent): AdminReply {
        val report = reportService.findDetail(event.getOption(AdminCommands.REPORT_ID_OPTION)!!.asLong)
        val snapshot = report.snapshot

        val body = listOf(
            "**ID**\n`${report.reportId}`",
            "**유형**\n${report.type.label}",
            "**사유**\n${report.reason.label}",
            "**신고자**\n${snapshot.reporter.nickname}(`${snapshot.reporter.memberId}`)",
            "**피신고자**\n${snapshot.reported.nickname}(`${snapshot.reported.memberId}`)",
            "**상세**\n${report.detail ?: NONE}",
            "**대화**\n${snapshot.messages.size}건",
            "**증거 사진**\n${report.evidencePhotoUrls.size}장",
            "**접수일**\n${DiscordEmbeds.format(report.reportedAt)}",
        ).joinToString("\n\n")

        return AdminReply.of(
            AdminCommands.REPORT,
            body,
            FileUpload.fromData(toText(report).toByteArray(), "report-${report.reportId}.txt"),
        )
    }

    private fun toText(report: ReportDetail): String {
        val snapshot = report.snapshot

        return listOf(
            REPORT_TEXT_TITLE,
            "[ID]\n${report.reportId}",
            "[유형]\n${report.type.label}",
            "[사유]\n${report.reason.label}",
            "[접수일]\n${DiscordEmbeds.format(report.reportedAt)}",
            "[신고자]\n${snapshot.reporter.nickname}(#${snapshot.reporter.memberId})",
            "[피신고자]\n${snapshot.reported.nickname}(#${snapshot.reported.memberId})",
            "[휴대폰]\n${snapshot.reported.phoneNumber}",
            "[코멘트]\n${snapshot.reported.comment ?: NONE}",
            "[자기소개]\n${snapshot.reported.bio ?: NONE}",
            "[상세]\n${report.detail ?: NONE}",
            listBlock("증거 사진 ${report.evidencePhotoUrls.size}장", numbered(report.evidencePhotoUrls)),
            listBlock("신고 시점 프로필 사진 ${report.profilePhotoUrls.size}장", numbered(report.profilePhotoUrls)),
            listBlock(
                "대화 ${snapshot.messages.size}건",
                snapshot.messages.map {
                    "${DiscordEmbeds.formatSecond(it.createdAt)} ${nicknameOf(snapshot, it)}: ${contentOf(it, report)}"
                },
            ),
        ).joinToString("\n\n")
    }

    private fun listBlock(title: String, lines: List<String>) =
        lines.joinToString("\n", prefix = if (lines.isEmpty()) "[$title]" else "[$title]\n")

    private fun numbered(values: List<String>) = values.mapIndexed { index, value -> "${index + 1}. $value" }

    private fun nicknameOf(snapshot: ReportSnapshotContent, message: ChatMessageSnapshot) =
        if (message.senderId == snapshot.reporter.memberId) {
            snapshot.reporter.nickname
        } else {
            snapshot.reported.nickname
        }

    private fun contentOf(message: ChatMessageSnapshot, report: ReportDetail) =
        if (message.type == ChatMessageType.PHOTO) {
            report.messagePhotoUrls[message.messageId] ?: "사진"
        } else {
            message.content ?: ""
        }

    companion object {

        private const val NONE = "없음"
        private const val REPORT_TEXT_TITLE = "신고"
        private const val PENDING_TITLE = "미처리 신고 (오래된 순)"
        private const val NO_PENDING_MESSAGE = "미처리 신고가 없습니다."

        private val COMMAND_NAMES = setOf(AdminCommands.REPORT, AdminCommands.REPORTS, AdminCommands.HANDLE)
    }
}
