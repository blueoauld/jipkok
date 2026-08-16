package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.entity.type.MemberView
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.member.service.MemberService
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.response.ReportDetail
import com.blueoauld.server.domain.report.service.ReportService
import com.blueoauld.server.domain.suspension.dto.response.SuspensionDetail
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.config.TaskExecutorConfig
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.DiscordProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import net.dv8tion.jda.api.EmbedBuilder
import net.dv8tion.jda.api.entities.MessageEmbed
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent
import net.dv8tion.jda.api.events.session.ReadyEvent
import net.dv8tion.jda.api.hooks.ListenerAdapter
import net.dv8tion.jda.api.interactions.commands.OptionType
import net.dv8tion.jda.api.interactions.commands.build.Commands
import net.dv8tion.jda.api.interactions.commands.build.OptionData
import net.dv8tion.jda.api.interactions.commands.build.SlashCommandData
import net.dv8tion.jda.api.utils.FileUpload
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.task.TaskExecutor
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val log = KotlinLogging.logger {}

@Component
class AdminCommandListener(

    private val memberSuspensionService: MemberSuspensionService,
    private val memberService: MemberService,
    private val reportService: ReportService,
    private val discordProperties: DiscordProperties,

    @Qualifier(TaskExecutorConfig.TASK_EXECUTOR)
    private val taskExecutor: TaskExecutor,
) : ListenerAdapter() {

    override fun onReady(event: ReadyEvent) {
        event.jda.getGuildById(discordProperties.guildId)
            ?.updateCommands()
            ?.addCommands(commands())
            ?.queue()
            ?: log.error { "디스코드 길드를 찾지 못했다. guildId=${discordProperties.guildId}" }
    }

    override fun onSlashCommandInteraction(event: SlashCommandInteractionEvent) {
        if (event.name !in COMMAND_NAMES) {
            return
        }

        if (event.member?.roles?.none { it.id == discordProperties.roleId } != false) {
            event.reply(FORBIDDEN_MESSAGE).setEphemeral(true).queue()
            return
        }

        event.deferReply(true).queue()

        taskExecutor.execute {
            runCatching { handle(event) }
                .onSuccess { reply(event, it) }
                .onFailure { reply(event, toMessage(it)) }
        }
    }

    private fun record(event: SlashCommandInteractionEvent, suspension: SuspensionDetail) {
        val embed = EmbedBuilder()
            .setTitle(if (suspension.releasedAt == null) SUSPEND else RELEASE)
            .addField("ID", "`${suspension.id}`", false)
            .addField("회원", "${nicknameOf(suspension)}(`${suspension.memberId}`)", false)
            .addField("유형", suspension.type.label, false)
            .addField("사유", suspension.reason.label, false)
            .addField("기간", period(suspension), false)
            .apply {
                suspension.releasedAt?.let { addField("해제", format(it), false) }
                suspension.detail?.let { addField("상세", it, false) }
            }
            .setFooter("@${event.user.effectiveName}", event.user.effectiveAvatarUrl)
            .build()

        send(event, discordProperties.suspensionChannelId, embed)
    }

    private fun period(suspension: SuspensionDetail) =
        "${format(suspension.startedAt)} ~ ${suspension.expiresAt?.let(::format) ?: "영구"}"

    private fun nicknameOf(suspension: SuspensionDetail) =
        if (suspension.withdrawn) "~~${suspension.nickname}~~" else suspension.nickname

    private fun send(event: SlashCommandInteractionEvent, channelId: String, embed: MessageEmbed) {
        event.jda.getTextChannelById(channelId)
            ?.sendMessageEmbeds(embed)
            ?.queue()
            ?: log.error { "채널을 찾지 못했다. channelId=$channelId" }
    }

    private fun handle(event: SlashCommandInteractionEvent): Any = when (event.name) {
        SUSPEND -> suspend(event)
        RELEASE -> release(event)
        RESET -> reset(event)
        MEMBER -> member(event)
        REPORT -> report(event)
        REPORTS -> reports()
        HANDLE -> markHandled(event)
        else -> history(event)
    }

    private fun reports(): Any {
        val pending = reportService.findPending()

        if (pending.isEmpty()) {
            return NO_PENDING_MESSAGE
        }

        val body = pending.joinToString("\n") {
            "`${it.reportId}` ${format(it.reportedAt)} / ${it.type.label} / ${it.reason.label}" +
                    " / 피신고자 `${it.reportedMemberId}`"
        }

        return toEmbeds(PENDING_TITLE, body)
    }

    private fun markHandled(event: SlashCommandInteractionEvent): String {
        val reportId = event.getOption(REPORT_ID_OPTION)!!.asLong

        reportService.handle(reportId)

        return "신고 `$reportId` 처리 완료"
    }

    private fun report(event: SlashCommandInteractionEvent): EmbedReply {
        val report = reportService.findDetail(event.getOption(REPORT_ID_OPTION)!!.asLong)
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
            "**접수일**\n${format(report.reportedAt)}",
        ).joinToString("\n\n")

        return toEmbeds(
            REPORT,
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
            "[접수일]\n${format(report.reportedAt)}",
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
                    "${formatSecond(it.createdAt)} ${nicknameOf(snapshot, it)}: ${contentOf(it, report)}"
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

    private fun member(event: SlashCommandInteractionEvent): Any {
        val memberId = event.getOption(MEMBER_ID_OPTION)!!.asLong

        return when (MemberView.valueOf(event.getOption(TARGET_OPTION)!!.asString)) {
            MemberView.PROFILE -> profile(memberId)
            MemberView.PUBLIC_PHOTO -> photos(memberId, MemberView.PUBLIC_PHOTO, PhotoVisibility.PUBLIC)
            MemberView.SECRET_PHOTO -> photos(memberId, MemberView.SECRET_PHOTO, PhotoVisibility.SECRET)
        }
    }

    private fun photos(memberId: Long, view: MemberView, visibility: PhotoVisibility): Any {
        val urls = memberService.findPhotoUrls(memberId, visibility)

        if (urls.isEmpty()) {
            return "사진이 없습니다."
        }

        val body = urls.mapIndexed { index, url -> "${index + 1}. $url" }.joinToString("\n")

        return toEmbeds(view.label, body)
    }

    private fun profile(memberId: Long): EmbedReply {
        val member = memberService.findForAdmin(memberId)

        val body = listOf(
            "**ID**\n`${member.memberId}`",
            "**닉네임**\n${member.nickname}",
            "**휴대폰**\n`${member.phoneNumber}`",
            "**성별**\n${member.gender.label}",
            "**나이**\n${member.age}살",
            "**좋아요**\n${member.receivedLikeCount}",
            "**공개 사진**\n${member.publicPhotoCount}장",
            "**비밀 사진**\n${member.secretPhotoCount}장",
            "**포인트**\n${member.pointBalance}",
            "**쪽지 수신**\n${mark(member.noteReceiveEnabled)}",
            "**코멘트**\n${member.comment ?: NONE}",
            "**자기소개**\n${member.bio ?: NONE}",
            "**가입일**\n${format(member.joinedAt)}",
            "**갱신일**\n${member.locatedAt?.let(::format) ?: NONE}",
        ).joinToString("\n\n")

        return toEmbeds(MEMBER, body)
    }

    private fun toEmbeds(title: String, body: String, file: FileUpload? = null) =
        EmbedReply(DiscordEmbeds.of(title, body), file)

    private class EmbedReply(val embeds: List<MessageEmbed>, val file: FileUpload?)

    private fun mark(enabled: Boolean) = if (enabled) "O" else "X"

    private fun reset(event: SlashCommandInteractionEvent): String {
        val memberId = event.getOption(MEMBER_ID_OPTION)!!.asLong
        val target = ProfileTarget.valueOf(event.getOption(TARGET_OPTION)!!.asString)
        val nickname = memberService.resetProfile(memberId, target)

        val embed = EmbedBuilder()
            .setTitle(RESET)
            .addField("항목", target.label, false)
            .addField("회원", "$nickname(`$memberId`)", false)
            .setFooter("@${event.user.effectiveName}", event.user.effectiveAvatarUrl)
            .build()

        send(event, discordProperties.resetChannelId, embed)

        return "$nickname(`$memberId`) / ${target.label} 초기화"
    }

    private fun suspend(event: SlashCommandInteractionEvent): String {
        val memberId = event.getOption(MEMBER_ID_OPTION)!!.asLong
        val type = SuspensionType.valueOf(event.getOption(TYPE_OPTION)!!.asString)
        val days = event.getOption(DAYS_OPTION)!!.asLong

        val suspension = runCatching {
            memberSuspensionService.suspend(
                memberId = memberId,
                type = type,
                reason = SuspensionReason.valueOf(event.getOption(REASON_OPTION)!!.asString),
                days = days.takeIf { it > 0 },
                detail = event.getOption(DETAIL_OPTION)?.asString,
            )
        }.getOrElse { throw if (isDuplicate(it)) DuplicateSuspension(memberId, type) else it }

        record(event, suspension)

        return "정지했습니다.\n${describe(suspension)}"
    }

    private fun reply(event: SlashCommandInteractionEvent, result: Any) {
        if (result is EmbedReply) {
            val action = event.hook.sendMessageEmbeds(result.embeds)

            result.file?.let { action.addFiles(it) }
            action.queue()
            return
        }

        DiscordEmbeds.chunk(result.toString(), MESSAGE_MAX_LENGTH)
            .forEach { event.hook.sendMessage(it).setSuppressEmbeds(true).queue() }
    }

    private fun isDuplicate(throwable: Throwable) =
        throwable is BusinessException && throwable.errorCode == ErrorCode.DUPLICATE_SUSPENSION

    private fun describeDuplicate(memberId: Long, type: SuspensionType) =
        memberSuspensionService.findActiveDetails(memberId, type)
            .joinToString("\n", prefix = "${ErrorCode.DUPLICATE_SUSPENSION.message}\n", transform = ::describe)

    private class DuplicateSuspension(val memberId: Long, val type: SuspensionType) : RuntimeException()

    private fun release(event: SlashCommandInteractionEvent): String {
        val suspensions = memberSuspensionService.release(
            memberId = event.getOption(MEMBER_ID_OPTION)!!.asLong,
            type = SuspensionType.valueOf(event.getOption(TYPE_OPTION)!!.asString),
        )

        suspensions.forEach { record(event, it) }

        return suspensions.joinToString("\n", prefix = "정지를 해제했습니다.\n") { describe(it) }
    }

    private fun history(event: SlashCommandInteractionEvent): Any {
        val suspensions = memberSuspensionService.findHistory(event.getOption(MEMBER_ID_OPTION)!!.asLong)

        if (suspensions.isEmpty()) {
            return "정지 이력이 없습니다."
        }

        val lines = suspensions.mapIndexed { index, it -> "${index + 1}. ${describe(it)}" }.joinToString("\n")
        val body = "**횟수**\n${suspensions.size}\n\n**내역**\n$lines"

        return toEmbeds(HISTORY_TITLE, body)
    }

    private fun describe(suspension: SuspensionDetail) = buildString {
        append("`${suspension.id}` / ${nicknameOf(suspension)}(`${suspension.memberId}`)")
        append(" / ${suspension.type.label} / ${suspension.reason.label}")
        append(" / ${period(suspension)}")
        suspension.releasedAt?.let { append(" / ${format(it)}") }
        suspension.detail?.let { append(" / $it") }
        suspension.releasedAt?.let { append(" **$RELEASED**") }
    }

    private fun format(instant: Instant) = FORMATTER.format(instant.atZone(KOREA))

    private fun formatSecond(instant: Instant) = SECOND_FORMATTER.format(instant.atZone(KOREA))

    private fun toMessage(throwable: Throwable) = when (throwable) {
        is DuplicateSuspension -> describeDuplicate(throwable.memberId, throwable.type)
        is BusinessException -> throwable.errorCode.message
        else -> FAILED_MESSAGE
    }

    companion object {

        const val SUSPEND = "정지"
        const val RELEASE = "정지해제"
        const val HISTORY = "정지조회"
        const val RESET = "초기화"
        const val MEMBER = "회원조회"
        const val REPORT = "신고조회"
        const val REPORTS = "신고목록"
        const val HANDLE = "신고처리"

        private const val MEMBER_ID_OPTION = "회원id"
        private const val REPORT_ID_OPTION = "신고id"
        private const val TYPE_OPTION = "유형"
        private const val TARGET_OPTION = "항목"
        private const val REASON_OPTION = "사유"
        private const val DAYS_OPTION = "기간"
        private const val DETAIL_OPTION = "상세"

        private const val MESSAGE_MAX_LENGTH = 1900

        private const val HISTORY_TITLE = "정지 이력 (최신순)"
        private const val PENDING_TITLE = "미처리 신고 (오래된 순)"
        private const val NO_PENDING_MESSAGE = "미처리 신고가 없습니다."

        private const val NONE = "없음"
        private const val REPORT_TEXT_TITLE = "신고"
        private const val RELEASED = "해제"

        private const val FORBIDDEN_MESSAGE = "권한이 없습니다."
        private const val FAILED_MESSAGE = "처리하지 못했습니다."

        private val COMMAND_NAMES = setOf(SUSPEND, RELEASE, HISTORY, RESET, MEMBER, REPORT, REPORTS, HANDLE)

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")

        private val FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")

        private val SECOND_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")

        fun commands(): List<SlashCommandData> = listOf(
            Commands.slash(SUSPEND, "회원을 정지한다.")
                .addOption(OptionType.INTEGER, MEMBER_ID_OPTION, "회원 ID", true)
                .addOptions(
                    typeOption(),
                    reasonOption(),
                )
                .addOption(OptionType.INTEGER, DAYS_OPTION, "정지 일수, 0이면 영구", true)
                .addOption(OptionType.STRING, DETAIL_OPTION, "상세 사유"),
            Commands.slash(RELEASE, "정지를 해제한다.")
                .addOption(OptionType.INTEGER, MEMBER_ID_OPTION, "회원 ID", true)
                .addOptions(typeOption()),
            Commands.slash(HISTORY, "회원의 정지 이력을 본다.")
                .addOption(OptionType.INTEGER, MEMBER_ID_OPTION, "회원 ID", true),
            Commands.slash(REPORT, "신고 내용을 본다.")
                .addOption(OptionType.INTEGER, REPORT_ID_OPTION, "신고 ID", true),
            Commands.slash(REPORTS, "미처리 신고를 본다."),
            Commands.slash(HANDLE, "신고를 처리 완료로 표시한다.")
                .addOption(OptionType.INTEGER, REPORT_ID_OPTION, "신고 ID", true),
            Commands.slash(MEMBER, "회원 정보를 본다.")
                .addOption(OptionType.INTEGER, MEMBER_ID_OPTION, "회원 ID", true)
                .addOptions(viewOption()),
            Commands.slash(RESET, "회원의 프로필을 초기화한다.")
                .addOption(OptionType.INTEGER, MEMBER_ID_OPTION, "회원 ID", true)
                .addOptions(targetOption()),
        )

        private fun typeOption() =
            OptionData(
                OptionType.STRING,
                TYPE_OPTION,
                "정지 유형",
                true,
            ).apply {
                SuspensionType.entries.forEach { addChoice(it.label, it.name) }
            }

        private fun viewOption() =
            OptionData(
                OptionType.STRING,
                TARGET_OPTION,
                "볼 항목",
                true,
            ).apply {
                MemberView.entries.forEach { addChoice(it.label, it.name) }
            }

        private fun targetOption() =
            OptionData(
                OptionType.STRING,
                TARGET_OPTION,
                "초기화할 항목",
                true,
            ).apply {
                ProfileTarget.entries.forEach { addChoice(it.label, it.name) }
            }

        private fun reasonOption() =
            OptionData(
                OptionType.STRING,
                REASON_OPTION,
                "정지 사유",
                true,
            ).apply {
                SuspensionReason.entries.forEach { addChoice(it.label, it.name) }
            }
    }
}
