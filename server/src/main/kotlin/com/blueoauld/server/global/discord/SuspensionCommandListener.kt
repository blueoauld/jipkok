package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.suspension.dto.response.SuspensionDetail
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
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
class SuspensionCommandListener(

    private val memberSuspensionService: MemberSuspensionService,
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
            .onSuccess { event.hook.sendMessage(it).queue() }
            .onFailure { event.hook.sendMessage(toMessage(it)).queue() }
    }

    private fun record(event: SlashCommandInteractionEvent, suspension: SuspensionDetail) {
        event.jda.getTextChannelById(discordProperties.suspensionChannelId)
            ?.sendMessage("${describe(suspension)} ${event.user.asMention}")
            ?.queue()
            ?: log.error { "정지 채널을 찾지 못했다. channelId=${discordProperties.suspensionChannelId}" }
    }

    private fun handle(event: SlashCommandInteractionEvent) = when (event.name) {
        SUSPEND -> suspend(event)
        RELEASE -> release(event)
        else -> history(event)
    }

    private fun suspend(event: SlashCommandInteractionEvent): String {
        val days = event.getOption(DAYS_OPTION)!!.asLong

        val suspension = memberSuspensionService.suspend(
            memberId = event.getOption(MEMBER_ID_OPTION)!!.asLong,
            type = SuspensionType.valueOf(event.getOption(TYPE_OPTION)!!.asString),
            reason = SuspensionReason.valueOf(event.getOption(REASON_OPTION)!!.asString),
            days = days.takeIf { it > 0 },
            detail = event.getOption(DETAIL_OPTION)?.asString,
        )

        record(event, suspension)

        return "정지했습니다.\n${describe(suspension)}"
    }

    private fun release(event: SlashCommandInteractionEvent): String {
        val suspension = memberSuspensionService.release(
            memberId = event.getOption(MEMBER_ID_OPTION)!!.asLong,
            type = SuspensionType.valueOf(event.getOption(TYPE_OPTION)!!.asString),
        )

        record(event, suspension)

        return "정지를 해제했습니다.\n${describe(suspension)}"
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

    private fun toMessage(throwable: Throwable) =
        if (throwable is BusinessException) throwable.errorCode.message else FAILED_MESSAGE

    companion object {

        const val SUSPEND = "정지"
        const val RELEASE = "정지해제"
        const val HISTORY = "정지조회"

        private const val MEMBER_ID_OPTION = "회원id"
        private const val TYPE_OPTION = "유형"
        private const val REASON_OPTION = "사유"
        private const val DAYS_OPTION = "기간"
        private const val DETAIL_OPTION = "상세"

        private const val FORBIDDEN_MESSAGE = "권한이 없습니다."
        private const val FAILED_MESSAGE = "처리하지 못했습니다."

        private val COMMAND_NAMES = setOf(SUSPEND, RELEASE, HISTORY)

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
