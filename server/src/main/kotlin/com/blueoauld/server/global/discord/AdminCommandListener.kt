package com.blueoauld.server.global.discord

import com.blueoauld.server.global.config.TaskExecutorConfig
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.properties.DiscordProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent
import net.dv8tion.jda.api.events.session.ReadyEvent
import net.dv8tion.jda.api.hooks.ListenerAdapter
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.task.TaskExecutor
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
class AdminCommandListener(

    private val handlers: List<AdminCommandHandler>,
    private val discordProperties: DiscordProperties,

    @Qualifier(TaskExecutorConfig.TASK_EXECUTOR)
    private val taskExecutor: TaskExecutor,
) : ListenerAdapter() {

    override fun onReady(event: ReadyEvent) {
        event.jda.getGuildById(discordProperties.guildId)
            ?.updateCommands()
            ?.addCommands(AdminCommands.definitions())
            ?.queue()
            ?: log.error { "디스코드 길드를 찾지 못했다. guildId=${discordProperties.guildId}" }
    }

    override fun onSlashCommandInteraction(event: SlashCommandInteractionEvent) {
        val handler = handlers.firstOrNull { it.supports(event.name) } ?: return

        if (event.member?.roles?.none { it.id == discordProperties.roleId } != false) {
            event.reply(FORBIDDEN_MESSAGE).setEphemeral(true).queue()
            return
        }

        event.deferReply(true).queue()

        taskExecutor.execute {
            runCatching { handler.handle(event) }
                .onSuccess { reply(event, it) }
                .onFailure { reply(event, AdminReply.Text(toMessage(it))) }
        }
    }

    private fun reply(event: SlashCommandInteractionEvent, reply: AdminReply) {
        when (reply) {
            is AdminReply.Embeds -> {
                val action = event.hook.sendMessageEmbeds(reply.embeds)

                reply.file?.let { action.addFiles(it) }
                action.queue()
            }

            is AdminReply.Text ->
                DiscordEmbeds.chunk(reply.message, MESSAGE_MAX_LENGTH)
                    .forEach { event.hook.sendMessage(it).setSuppressEmbeds(true).queue() }
        }
    }

    private fun toMessage(throwable: Throwable) =
        if (throwable is BusinessException) throwable.errorCode.message else FAILED_MESSAGE

    companion object {

        private const val MESSAGE_MAX_LENGTH = 1900

        private const val FORBIDDEN_MESSAGE = "권한이 없습니다."
        private const val FAILED_MESSAGE = "처리하지 못했습니다."
    }
}
