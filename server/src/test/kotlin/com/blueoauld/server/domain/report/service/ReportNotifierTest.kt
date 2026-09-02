package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.ReportedMemberSnapshot
import com.blueoauld.server.domain.report.dto.ReporterSnapshot
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.event.ReportCreatedEvent
import com.blueoauld.server.global.discord.DiscordBot
import com.blueoauld.server.global.properties.DiscordProperties
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import net.dv8tion.jda.api.entities.MessageEmbed
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant

class ReportNotifierTest {

    private val discordBot = mockk<DiscordBot>(relaxed = true)

    private val notifier = ReportNotifier(discordBot, DiscordProperties(reportChannelId = CHANNEL_ID))

    @Test
    fun `프로필 신고는 코멘트와 자기소개를 담는다`() {
        // given
        val embeds = slot<List<MessageEmbed>>()
        every { discordBot.send(CHANNEL_ID, capture(embeds)) } returns Unit

        // when
        notifier.notifyCreated(event(ReportType.PROFILE, snapshot(messages = emptyList())))

        // then
        val body = embeds.captured.joinToString("\n") { it.description.orEmpty() }
        assertThat(body).contains("코멘트", "자기소개", "공개 사진")
        assertThat(body).doesNotContain("대화")
    }

    @Test
    fun `채팅 신고는 대화를 담고 프로필 항목은 빼놓는다`() {
        // given
        val embeds = slot<List<MessageEmbed>>()
        every { discordBot.send(CHANNEL_ID, capture(embeds)) } returns Unit

        // when
        notifier.notifyCreated(event(ReportType.CHAT, snapshot()))

        // then
        val body = embeds.captured.joinToString("\n") { it.description.orEmpty() }
        assertThat(body).contains("대화")
        assertThat(body).doesNotContain("자기소개")
    }

    @Test
    fun `대화는 마지막 세 건만 담고 보낸 사람 닉네임을 붙인다`() {
        // given
        val embeds = slot<List<MessageEmbed>>()
        every { discordBot.send(CHANNEL_ID, capture(embeds)) } returns Unit
        val messages = (1L..5L).map { message(it, senderId = if (it % 2 == 0L) REPORTER_ID else REPORTED_ID) }

        // when
        notifier.notifyCreated(event(ReportType.CHAT, snapshot(messages)))

        // then
        val body = embeds.captured.joinToString("\n") { it.description.orEmpty() }
        assertThat(body).contains("5건 중 마지막 3건")
        assertThat(body).contains("신고자: 내용3", "피신고자: 내용5")
        assertThat(body).doesNotContain("내용1")
    }

    @Test
    fun `사진과 동영상 메시지는 종류로 적는다`() {
        // given
        val embeds = slot<List<MessageEmbed>>()
        every { discordBot.send(CHANNEL_ID, capture(embeds)) } returns Unit
        val messages = listOf(
            message(1L, type = ChatMessageType.PHOTO),
            message(2L, type = ChatMessageType.VIDEO),
        )

        // when
        notifier.notifyCreated(event(ReportType.CHAT, snapshot(messages)))

        // then
        val body = embeds.captured.joinToString("\n") { it.description.orEmpty() }
        assertThat(body).contains("피신고자: 사진", "피신고자: 동영상")
    }

    @Test
    fun `대화가 없으면 없음으로 적는다`() {
        // given
        val embeds = slot<List<MessageEmbed>>()
        every { discordBot.send(CHANNEL_ID, capture(embeds)) } returns Unit

        // when
        notifier.notifyCreated(event(ReportType.CHAT, snapshot(messages = emptyList())))

        // then
        val body = embeds.captured.joinToString("\n") { it.description.orEmpty() }
        assertThat(body).contains("**대화**\n없음")
    }

    private fun event(type: ReportType, snapshot: ReportSnapshotContent) = ReportCreatedEvent(
        reportId = 100L,
        type = type,
        reason = ReportReason.ABUSE,
        detail = null,
        evidencePhotoCount = 2,
        snapshot = snapshot,
    )

    private fun snapshot(messages: List<ChatMessageSnapshot> = listOf(message(1L))) = ReportSnapshotContent(
        reporter = ReporterSnapshot(REPORTER_ID, "신고자"),
        reported = ReportedMemberSnapshot(
            memberId = REPORTED_ID,
            phoneNumber = "+821011112222",
            nickname = "피신고자",
            gender = Gender.FEMALE,
            birthYear = 1998,
            comment = "코멘트 내용",
            bio = "자기소개 내용",
            photoKeys = listOf("reports/snapshot/100/a.jpg"),
        ),
        messages = messages,
    )

    private fun message(
        messageId: Long,
        senderId: Long = REPORTED_ID,
        type: ChatMessageType = ChatMessageType.TEXT,
    ) = ChatMessageSnapshot(
        messageId = messageId,
        senderId = senderId,
        type = type,
        content = "내용$messageId",
        photoKey = null,
        createdAt = Instant.parse("2026-08-01T00:00:00Z"),
    )

    companion object {

        private const val CHANNEL_ID = "1"
        private const val REPORTER_ID = 1L
        private const val REPORTED_ID = 2L
    }
}
