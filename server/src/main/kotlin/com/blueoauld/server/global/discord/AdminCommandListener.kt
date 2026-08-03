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
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.DiscordProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import net.dv8tion.jda.api.EmbedBuilder
import net.dv8tion.jda.api.entities.MessageEmbed
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent
import net.dv8tion.jda.api.hooks.ListenerAdapter
import net.dv8tion.jda.api.interactions.commands.OptionType
import net.dv8tion.jda.api.interactions.commands.build.Commands
import net.dv8tion.jda.api.interactions.commands.build.OptionData
import net.dv8tion.jda.api.interactions.commands.build.SlashCommandData
import net.dv8tion.jda.api.utils.FileUpload
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
) : ListenerAdapter() {

    override fun onSlashCommandInteraction(event: SlashCommandInteractionEvent) {
        if (event.name !in COMMAND_NAMES) {
            return
        }

        if (event.member?.roles?.none { it.id == discordProperties.roleId } != false) {
            event.reply(FORBIDDEN_MESSAGE).setEphemeral(true).queue()
            return
        }

        event.deferReply(true).queue()

        runCatching { handle(event) }
            .onSuccess { reply(event, it) }
            .onFailure { reply(event, toMessage(it)) }
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
        else -> history(event)
    }

    private fun report(event: SlashCommandInteractionEvent): String {
        val report = reportService.findDetail(event.getOption(REPORT_ID_OPTION)!!.asLong)
        val snapshot = report.snapshot

        attach(event, "report-${report.reportId}.txt", toText(report))

        return buildString {
            appendLine(
                "`#${report.reportId}` ${report.type.label} / ${report.reason.label}" +
                        " / ${format(report.reportedAt)}"
            )
            appendLine(
                "${snapshot.reporter.nickname}(`#${snapshot.reporter.memberId}`)" +
                        " → ${snapshot.reported.nickname}(`#${snapshot.reported.memberId}`)",
            )
            append("대화 ${snapshot.messages.size}건 / 증거 사진 ${report.evidencePhotoUrls.size}장")
        }
    }

    private fun toText(report: ReportDetail) = buildString {
        val snapshot = report.snapshot

        appendLine("신고 #${report.reportId} ${report.type.label} / ${report.reason.label}")
        appendLine("접수 ${format(report.reportedAt)}")
        appendLine("신고자 ${snapshot.reporter.nickname}(#${snapshot.reporter.memberId})")
        appendLine("피신고자 ${snapshot.reported.nickname}(#${snapshot.reported.memberId})")
        appendLine("휴대폰 ${snapshot.reported.phoneNumber}")
        appendLine("코멘트 ${snapshot.reported.comment ?: "없음"}")
        appendLine("자기소개 ${snapshot.reported.bio ?: "없음"}")
        appendLine("상세 ${report.detail ?: "없음"}")

        appendLine()
        appendLine("[증거 사진 ${report.evidencePhotoUrls.size}장]")
        report.evidencePhotoUrls.forEachIndexed { index, url -> appendLine("${index + 1}. $url") }

        appendLine()
        appendLine("[신고 시점 프로필 사진 ${report.profilePhotoUrls.size}장]")
        report.profilePhotoUrls.forEachIndexed { index, url -> appendLine("${index + 1}. $url") }

        appendLine()
        appendLine("[대화 ${snapshot.messages.size}건]")
        snapshot.messages.forEach {
            appendLine("${format(it.createdAt)} ${nicknameOf(snapshot, it)}: ${contentOf(it)}")
        }
    }

    private fun nicknameOf(snapshot: ReportSnapshotContent, message: ChatMessageSnapshot) =
        if (message.senderId == snapshot.reporter.memberId) {
            snapshot.reporter.nickname
        } else {
            snapshot.reported.nickname
        }

    private fun contentOf(message: ChatMessageSnapshot) =
        if (message.type == ChatMessageType.PHOTO) message.photoKey ?: "사진" else message.content ?: ""

    private fun attach(event: SlashCommandInteractionEvent, name: String, text: String) {
        event.hook.sendFiles(FileUpload.fromData(text.toByteArray(), name)).queue()
    }

    private fun member(event: SlashCommandInteractionEvent): String {
        val memberId = event.getOption(MEMBER_ID_OPTION)!!.asLong

        return when (MemberView.valueOf(event.getOption(TARGET_OPTION)!!.asString)) {
            MemberView.PROFILE -> profile(memberId)
            MemberView.PUBLIC_PHOTO -> photos(memberId, PhotoVisibility.PUBLIC)
            MemberView.SECRET_PHOTO -> photos(memberId, PhotoVisibility.SECRET)
        }
    }

    private fun photos(memberId: Long, visibility: PhotoVisibility): String {
        val urls = memberService.findPhotoUrls(memberId, visibility)

        return if (urls.isEmpty()) {
            "사진이 없습니다."
        } else {
            urls.mapIndexed { index, url -> "${index + 1}. $url" }.joinToString("\n")
        }
    }

    private fun profile(memberId: Long): String {
        val member = memberService.findForAdmin(memberId)

        return buildString {
            appendLine("${member.nickname}(`#${member.memberId}`) / ${member.gender.label} / ${member.age}살")
            appendLine("${member.phoneNumber} / 가입 ${format(member.joinedAt)}")
            appendLine("접속 ${member.locatedAt?.let(::format) ?: "없음"} / 쪽지 수신 ${mark(member.noteReceiveEnabled)}")
            appendLine(
                "공개 사진 ${member.publicPhotoCount}장 / 비밀 사진 ${member.secretPhotoCount}장" +
                        " / 좋아요 ${member.receivedLikeCount} / 포인트 ${member.pointBalance}",
            )
            appendLine("코멘트: ${member.comment ?: "없음"}")
            append("자기소개: ${member.bio ?: "없음"}")
        }
    }

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
        if (result is List<*>) {
            event.hook.sendMessageEmbeds(result.filterIsInstance<MessageEmbed>()).queue()
            return
        }

        chunk(result.toString(), MESSAGE_MAX_LENGTH)
            .forEach { event.hook.sendMessage(it).setSuppressEmbeds(true).queue() }
    }

    private fun chunk(message: String, maxLength: Int) =
        message.lineSequence().fold(mutableListOf<String>()) { chunks, line ->
            val last = chunks.lastOrNull()

            if (last == null || last.length + line.length + 1 > maxLength) {
                chunks.add(line)
            } else {
                chunks[chunks.lastIndex] = "$last\n$line"
            }

            chunks
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

        return chunk(body, DESCRIPTION_MAX_LENGTH).mapIndexed { index, chunk ->
            EmbedBuilder()
                .apply { if (index == 0) setTitle(HISTORY_TITLE) }
                .setDescription(chunk)
                .build()
        }
    }

    private fun describe(suspension: SuspensionDetail) = buildString {
        append("`${suspension.id}` / ${nicknameOf(suspension)}(`${suspension.memberId}`)")
        append(" / ${suspension.type.label} / ${suspension.reason.label}")
        append(" / ${period(suspension)}")
        suspension.releasedAt?.let { append(" / ${format(it)} 해제") }
        suspension.detail?.let { append(" / $it") }
    }

    private fun format(instant: Instant) = FORMATTER.format(instant.atZone(KOREA))

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

        private const val MEMBER_ID_OPTION = "회원id"
        private const val REPORT_ID_OPTION = "신고id"
        private const val TYPE_OPTION = "유형"
        private const val TARGET_OPTION = "항목"
        private const val REASON_OPTION = "사유"
        private const val DAYS_OPTION = "기간"
        private const val DETAIL_OPTION = "상세"

        private const val MESSAGE_MAX_LENGTH = 1900
        private const val DESCRIPTION_MAX_LENGTH = 4096

        private const val HISTORY_TITLE = "정지 이력 (최신순)"

        private const val FORBIDDEN_MESSAGE = "권한이 없습니다."
        private const val FAILED_MESSAGE = "처리하지 못했습니다."

        private val COMMAND_NAMES = setOf(SUSPEND, RELEASE, HISTORY, RESET, MEMBER, REPORT)

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")

        private val FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")

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
