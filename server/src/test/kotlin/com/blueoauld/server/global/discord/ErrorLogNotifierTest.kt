package com.blueoauld.server.global.discord

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.LoggerContext
import ch.qos.logback.classic.spi.LoggingEvent
import com.blueoauld.server.global.properties.DiscordProperties
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import net.dv8tion.jda.api.entities.MessageEmbed
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatCode
import org.junit.jupiter.api.Test

class ErrorLogNotifierTest {

    private val discordBot = mockk<DiscordBot>(relaxed = true)

    private val notifier = ErrorLogNotifier(discordBot, properties()).apply { start() }

    @Test
    fun `에러 로그를 디스코드로 보낸다`() {
        // given
        val embeds = slot<List<MessageEmbed>>()
        every { discordBot.send(CHANNEL_ID, capture(embeds)) } returns Unit

        // when
        notifier.doAppend(event(message = "결제가 터졌다", throwable = IllegalStateException("원인")))

        // then
        val description = embeds.captured.first().description

        assertThat(description).contains("결제가 터졌다")
        assertThat(description).contains("IllegalStateException")
        assertThat(description).contains("원인")
    }

    @Test
    fun `에러 미만은 보내지 않는다`() {
        // when
        notifier.doAppend(event(level = Level.WARN))

        // then
        verify(exactly = 0) { discordBot.send(any(), any()) }
    }

    @Test
    fun `디스코드 쪽에서 난 에러는 보내지 않는다`() {
        // when
        notifier.doAppend(event(loggerName = DiscordBot::class.qualifiedName!!))
        notifier.doAppend(event(loggerName = "net.dv8tion.jda.internal.WebSocketClient"))

        // then
        verify(exactly = 0) { discordBot.send(any(), any()) }
    }

    @Test
    fun `분당 건수를 넘으면 버린다`() {
        // when
        repeat(7) { notifier.doAppend(event()) }

        // then
        verify(exactly = 5) { discordBot.send(CHANNEL_ID, any()) }
    }

    @Test
    fun `전송에 실패해도 로그 흐름을 막지 않는다`() {
        // given
        every { discordBot.send(any(), any()) } throws RuntimeException("전송 실패")

        // when, then
        assertThatCode { notifier.doAppend(event()) }.doesNotThrowAnyException()
    }

    private fun event(
        level: Level = Level.ERROR,
        loggerName: String = "com.blueoauld.server.domain.point.service.PointService",
        message: String = "에러가 났다",
        throwable: Throwable? = null,
    ): LoggingEvent {
        val logger = LoggerContext().getLogger(loggerName)

        return LoggingEvent(loggerName, logger, level, message, throwable, null)
    }

    private fun properties() = DiscordProperties(
        token = "token",
        guildId = "1",
        roleId = "1",
        suspensionChannelId = "1",
        resetChannelId = "1",
        reportChannelId = "1",
        moderationChannelId = "1",
        errorChannelId = CHANNEL_ID,
    )

    companion object {

        private const val CHANNEL_ID = "9999"
    }
}
