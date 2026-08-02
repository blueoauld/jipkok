package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.member.entity.type.MemberView
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.member.service.MemberService
import com.blueoauld.server.domain.suspension.dto.response.SuspensionDetail
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.DiscordProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent
import net.dv8tion.jda.api.hooks.ListenerAdapter
import net.dv8tion.jda.api.interactions.commands.OptionType
import net.dv8tion.jda.api.interactions.commands.build.Commands
import net.dv8tion.jda.api.interactions.commands.build.OptionData
import net.dv8tion.jda.api.interactions.commands.build.SlashCommandData
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val log = KotlinLogging.logger {}

@Component
class AdminCommandListener(

    private val memberSuspensionService: MemberSuspensionService,
    private val memberService: MemberService,
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
        send(event, discordProperties.suspensionChannelId, "${describe(suspension)} ${event.user.asMention}")
    }

    private fun send(event: SlashCommandInteractionEvent, channelId: String, message: String) {
        event.jda.getTextChannelById(channelId)
            ?.sendMessage(message)
            ?.queue()
            ?: log.error { "채널을 찾지 못했다. channelId=$channelId" }
    }

    private fun handle(event: SlashCommandInteractionEvent) = when (event.name) {
        SUSPEND -> suspend(event)
        RELEASE -> release(event)
        RESET -> reset(event)
        MEMBER -> member(event)
        else -> history(event)
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
        val message = "$nickname(`#$memberId`) / ${target.label} 초기화"

        send(event, discordProperties.resetChannelId, "$message ${event.user.asMention}")

        return message
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

    private fun reply(event: SlashCommandInteractionEvent, message: String) {
        chunk(message).forEach { event.hook.sendMessage(it).setSuppressEmbeds(true).queue() }
    }

    private fun chunk(message: String) = message.lineSequence().fold(mutableListOf<String>()) { chunks, line ->
        val last = chunks.lastOrNull()

        if (last == null || last.length + line.length + 1 > MESSAGE_MAX_LENGTH) {
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

    private fun history(event: SlashCommandInteractionEvent): String {
        val suspensions = memberSuspensionService.findHistory(event.getOption(MEMBER_ID_OPTION)!!.asLong)

        if (suspensions.isEmpty()) {
            return "정지 이력이 없습니다."
        }

        return suspensions.joinToString("\n", prefix = "정지 이력 ${suspensions.size}건\n") { describe(it) }
    }

    private fun describe(suspension: SuspensionDetail) = buildString {
        val nickname = if (suspension.withdrawn) "~~${suspension.nickname}~~" else suspension.nickname

        append("`#${suspension.id}` $nickname(`#${suspension.memberId}`)")
        append(" / ${suspension.type.label} / ${suspension.reason.label}")
        append(" / ${format(suspension.startedAt)} ~ ${suspension.expiresAt?.let(::format) ?: "영구"}")
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

        private const val MEMBER_ID_OPTION = "회원id"
        private const val TYPE_OPTION = "유형"
        private const val TARGET_OPTION = "항목"
        private const val REASON_OPTION = "사유"
        private const val DAYS_OPTION = "기간"
        private const val DETAIL_OPTION = "상세"

        private const val MESSAGE_MAX_LENGTH = 1900

        private const val FORBIDDEN_MESSAGE = "권한이 없습니다."
        private const val FAILED_MESSAGE = "처리하지 못했습니다."

        private val COMMAND_NAMES = setOf(SUSPEND, RELEASE, HISTORY, RESET, MEMBER)

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
