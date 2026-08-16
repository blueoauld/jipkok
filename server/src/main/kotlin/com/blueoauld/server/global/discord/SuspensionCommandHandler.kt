package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.suspension.dto.response.SuspensionDetail
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.DiscordProperties
import net.dv8tion.jda.api.EmbedBuilder
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent
import org.springframework.stereotype.Component

@Component
class SuspensionCommandHandler(

    private val memberSuspensionService: MemberSuspensionService,
    private val discordProperties: DiscordProperties,
) : AdminCommandHandler {

    override fun supports(name: String) = name in COMMAND_NAMES

    override fun handle(event: SlashCommandInteractionEvent): AdminReply = when (event.name) {
        AdminCommands.SUSPEND -> suspend(event)
        AdminCommands.RELEASE -> release(event)
        else -> history(event)
    }

    private fun suspend(event: SlashCommandInteractionEvent): AdminReply {
        val memberId = event.getOption(AdminCommands.MEMBER_ID_OPTION)!!.asLong
        val type = SuspensionType.valueOf(event.getOption(AdminCommands.TYPE_OPTION)!!.asString)
        val days = event.getOption(AdminCommands.DAYS_OPTION)!!.asLong

        val suspension = runCatching {
            memberSuspensionService.suspend(
                memberId = memberId,
                type = type,
                reason = SuspensionReason.valueOf(event.getOption(AdminCommands.REASON_OPTION)!!.asString),
                days = days.takeIf { it > 0 },
                detail = event.getOption(AdminCommands.DETAIL_OPTION)?.asString,
            )
        }.getOrElse {
            if (!isDuplicate(it)) {
                throw it
            }

            return AdminReply.Text(describeDuplicate(memberId, type))
        }

        record(event, suspension)

        return AdminReply.Text("정지했습니다.\n${describe(suspension)}")
    }

    private fun release(event: SlashCommandInteractionEvent): AdminReply {
        val suspensions = memberSuspensionService.release(
            memberId = event.getOption(AdminCommands.MEMBER_ID_OPTION)!!.asLong,
            type = SuspensionType.valueOf(event.getOption(AdminCommands.TYPE_OPTION)!!.asString),
        )

        suspensions.forEach { record(event, it) }

        return AdminReply.Text(suspensions.joinToString("\n", prefix = "정지를 해제했습니다.\n") { describe(it) })
    }

    private fun history(event: SlashCommandInteractionEvent): AdminReply {
        val suspensions = memberSuspensionService.findHistory(
            event.getOption(AdminCommands.MEMBER_ID_OPTION)!!.asLong,
        )

        if (suspensions.isEmpty()) {
            return AdminReply.Text("정지 이력이 없습니다.")
        }

        val lines = suspensions.mapIndexed { index, it -> "${index + 1}. ${describe(it)}" }.joinToString("\n")

        return AdminReply.of(HISTORY_TITLE, "**횟수**\n${suspensions.size}\n\n**내역**\n$lines")
    }

    private fun record(event: SlashCommandInteractionEvent, suspension: SuspensionDetail) {
        val embed = EmbedBuilder()
            .setTitle(if (suspension.releasedAt == null) AdminCommands.SUSPEND else AdminCommands.RELEASE)
            .addField("ID", "`${suspension.id}`", false)
            .addField("회원", "${nicknameOf(suspension)}(`${suspension.memberId}`)", false)
            .addField("유형", suspension.type.label, false)
            .addField("사유", suspension.reason.label, false)
            .addField("기간", period(suspension), false)
            .apply {
                suspension.releasedAt?.let { addField("해제", DiscordEmbeds.format(it), false) }
                suspension.detail?.let { addField("상세", it, false) }
            }
            .setFooter("@${event.user.effectiveName}", event.user.effectiveAvatarUrl)
            .build()

        event.sendTo(discordProperties.suspensionChannelId, embed)
    }

    private fun isDuplicate(throwable: Throwable) =
        throwable is BusinessException && throwable.errorCode == ErrorCode.DUPLICATE_SUSPENSION

    private fun describeDuplicate(memberId: Long, type: SuspensionType) =
        memberSuspensionService.findActiveDetails(memberId, type)
            .joinToString("\n", prefix = "${ErrorCode.DUPLICATE_SUSPENSION.message}\n", transform = ::describe)

    private fun describe(suspension: SuspensionDetail) = buildString {
        append("`${suspension.id}` / ${nicknameOf(suspension)}(`${suspension.memberId}`)")
        append(" / ${suspension.type.label} / ${suspension.reason.label}")
        append(" / ${period(suspension)}")
        suspension.releasedAt?.let { append(" / ${DiscordEmbeds.format(it)}") }
        suspension.detail?.let { append(" / $it") }
        suspension.releasedAt?.let { append(" **$RELEASED**") }
    }

    private fun period(suspension: SuspensionDetail) =
        "${DiscordEmbeds.format(suspension.startedAt)} ~ " +
            "${suspension.expiresAt?.let(DiscordEmbeds::format) ?: "영구"}"

    private fun nicknameOf(suspension: SuspensionDetail) =
        if (suspension.withdrawn) "~~${suspension.nickname}~~" else suspension.nickname

    companion object {

        private const val HISTORY_TITLE = "정지 이력 (최신순)"
        private const val RELEASED = "해제"

        private val COMMAND_NAMES = setOf(AdminCommands.SUSPEND, AdminCommands.RELEASE, AdminCommands.HISTORY)
    }
}
