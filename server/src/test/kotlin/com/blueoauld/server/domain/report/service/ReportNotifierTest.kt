package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.ReportedMemberSnapshot
import com.blueoauld.server.domain.report.dto.ReporterSnapshot
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.event.ReportCreatedEvent
import com.blueoauld.server.global.discord.DiscordBot
import com.blueoauld.server.global.properties.AdminProperties
import com.blueoauld.server.global.properties.DiscordProperties
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import net.dv8tion.jda.api.entities.MessageEmbed
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class ReportNotifierTest {

    private val discordBot = mockk<DiscordBot>(relaxed = true)

    private val notifier = ReportNotifier(
        discordBot,
        DiscordProperties(reportChannelId = CHANNEL_ID),
        AdminProperties(baseUrl = ADMIN_BASE_URL),
    )

    @Test
    fun `ID, 유형, 사유, 신고자, 피신고자, 링크만 담는다`() {
        // given
        val embeds = slot<List<MessageEmbed>>()
        every { discordBot.send(CHANNEL_ID, capture(embeds)) } returns Unit

        // when
        notifier.notifyCreated(event(ReportType.PROFILE))

        // then
        val body = embeds.captured.joinToString("\n") { it.description.orEmpty() }
        assertThat(body).isEqualTo(
            """
            **ID**
            `100`

            **유형**
            ${ReportType.PROFILE.label}

            **사유**
            ${ReportReason.ABUSE.label}

            **신고자**
            신고자(`1`)

            **피신고자**
            피신고자(`2`)

            **링크**
            $ADMIN_BASE_URL/reports/members/detail?id=100
            """.trimIndent(),
        )
    }

    @Test
    fun `채팅 신고도 같은 항목만 담는다`() {
        // given
        val embeds = slot<List<MessageEmbed>>()
        every { discordBot.send(CHANNEL_ID, capture(embeds)) } returns Unit

        // when
        notifier.notifyCreated(event(ReportType.CHAT))

        // then
        val body = embeds.captured.joinToString("\n") { it.description.orEmpty() }
        assertThat(body).contains("**유형**\n${ReportType.CHAT.label}")
        assertThat(body).doesNotContain("대화", "코멘트", "자기소개")
    }

    private fun event(type: ReportType) = ReportCreatedEvent(
        reportId = 100L,
        type = type,
        reason = ReportReason.ABUSE,
        snapshot = ReportSnapshotContent(
            reporter = ReporterSnapshot(REPORTER_ID, "신고자"),
            reported = ReportedMemberSnapshot(
                memberId = REPORTED_ID,
                phoneNumber = "+821011112222",
                nickname = "피신고자",
                gender = Gender.FEMALE,
                birthYear = 1998,
                comment = null,
                bio = null,
                photoKeys = emptyList(),
            ),
        ),
    )

    companion object {

        private const val CHANNEL_ID = "1"
        private const val ADMIN_BASE_URL = "https://admin.example.com"
        private const val REPORTER_ID = 1L
        private const val REPORTED_ID = 2L
    }
}
