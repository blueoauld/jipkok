package com.blueoauld.server.global.discord

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.classic.spi.IThrowableProxy
import ch.qos.logback.core.AppenderBase
import com.blueoauld.server.global.properties.DiscordProperties
import jakarta.annotation.PostConstruct
import jakarta.annotation.PreDestroy
import net.dv8tion.jda.api.entities.MessageEmbed
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

@Component
@ConditionalOnDiscord
@ConditionalOnExpression("!'\${discord.error-channel-id:}'.isEmpty()")
class ErrorLogNotifier(

    private val discordBot: DiscordBot,
    private val discordProperties: DiscordProperties,
) : AppenderBase<ILoggingEvent>() {

    private var windowStart = 0L
    private var sentInWindow = 0

    @PostConstruct
    fun attach() {
        val root = rootLogger()
        context = root.loggerContext
        start()
        root.addAppender(this)
    }

    @PreDestroy
    fun detach() {
        rootLogger().detachAppender(this)
        stop()
    }

    override fun append(event: ILoggingEvent) {
        if (!event.level.isGreaterOrEqual(Level.ERROR)) {
            return
        }

        if (SKIPPED_LOGGER_PREFIXES.any { event.loggerName.startsWith(it) }) {
            return
        }

        if (!tryAcquire(event.timeStamp)) {
            return
        }

        runCatching { discordBot.send(discordProperties.errorChannelId, toEmbeds(event)) }
    }

    @Synchronized
    private fun tryAcquire(timestamp: Long): Boolean {
        if (timestamp - windowStart >= WINDOW_MILLIS) {
            windowStart = timestamp
            sentInWindow = 0
        }

        if (sentInWindow >= MAX_PER_WINDOW) {
            return false
        }

        sentInWindow++
        return true
    }

    private fun toEmbeds(event: ILoggingEvent): List<MessageEmbed> {
        val body = listOfNotNull(
            DiscordEmbeds.field("로거", event.loggerName),
            DiscordEmbeds.field("메시지", event.formattedMessage),
            event.throwableProxy?.let { DiscordEmbeds.field("예외", describe(it)) },
        ).joinToString("\n\n")

        return DiscordEmbeds.of(TITLE, body)
    }

    private fun describe(throwable: IThrowableProxy): String {
        val frames = throwable.stackTraceElementProxyArray
            .take(STACK_TRACE_DEPTH)
            .joinToString("\n") { it.steAsString }

        return "```\n${throwable.className}: ${throwable.message}\n$frames\n```"
    }

    private fun rootLogger() = LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME) as Logger

    companion object {

        private const val TITLE = "에러"
        private const val WINDOW_MILLIS = 60_000L
        private const val MAX_PER_WINDOW = 5
        private const val STACK_TRACE_DEPTH = 10

        private val SKIPPED_LOGGER_PREFIXES = listOf(
            "com.blueoauld.server.global.discord",
            "net.dv8tion",
        )
    }
}
