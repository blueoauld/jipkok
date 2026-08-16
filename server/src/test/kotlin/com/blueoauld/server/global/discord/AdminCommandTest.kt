package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.member.entity.type.MemberView
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.domain.report.service.ReportService
import com.blueoauld.server.domain.suspension.dto.response.SuspensionDetail
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.DiscordProperties
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import net.dv8tion.jda.api.entities.Message
import net.dv8tion.jda.api.entities.Role
import net.dv8tion.jda.api.entities.User
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent
import net.dv8tion.jda.api.interactions.InteractionHook
import net.dv8tion.jda.api.interactions.commands.OptionMapping
import net.dv8tion.jda.api.requests.restaction.WebhookMessageCreateAction
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.core.task.SyncTaskExecutor
import java.time.Instant
import net.dv8tion.jda.api.entities.Member as DiscordMember

class AdminCommandTest {

    private val memberSuspensionService = mockk<MemberSuspensionService>(relaxed = true)

    private val memberAdminService = mockk<MemberAdminService>(relaxed = true)

    private val reportService = mockk<ReportService>(relaxed = true)

    private val messageAction = mockk<WebhookMessageCreateAction<Message>>(relaxed = true)

    private val hook = mockk<InteractionHook>(relaxed = true)

    private val listener = AdminCommandListener(
        listOf(
            SuspensionCommandHandler(memberSuspensionService, discordProperties()),
            MemberCommandHandler(memberAdminService, discordProperties()),
            ReportCommandHandler(reportService),
        ),
        discordProperties(),
        SyncTaskExecutor(),
    )

    @BeforeEach
    fun setUp() {
        every { messageAction.setSuppressEmbeds(any()) } returns messageAction
        every { hook.sendMessage(any<String>()) } returns messageAction
    }

    @Test
    fun `역할이 없으면 명령을 실행하지 않는다`() {
        // given
        val event = event(AdminCommands.RESET, hasRole = false)

        // when
        listener.onSlashCommandInteraction(event)

        // then
        verify { event.reply("권한이 없습니다.") }
        verify(exactly = 0) { memberAdminService.resetProfile(any(), any()) }
    }

    @Test
    fun `모르는 명령은 무시한다`() {
        // given
        val event = event("아무명령")

        // when
        listener.onSlashCommandInteraction(event)

        // then
        verify(exactly = 0) { event.deferReply(any()) }
    }

    @Test
    fun `정지 명령이 회원을 정지하고 결과를 답한다`() {
        // given
        every { memberSuspensionService.suspend(any(), any(), any(), any(), any()) } returns suspensionDetail()
        val event = event(
            AdminCommands.SUSPEND,
            mapOf("회원id" to MEMBER_ID, "유형" to "SERVICE", "사유" to "ABUSE", "기간" to 7L),
        )

        // when
        listener.onSlashCommandInteraction(event)

        // then
        verify {
            memberSuspensionService.suspend(MEMBER_ID, SuspensionType.SERVICE, SuspensionReason.ABUSE, 7L, null)
        }
        assertThat(replied()).contains("정지했습니다.", "홍길동")
    }

    @Test
    fun `기간을 0으로 주면 영구 정지로 넘긴다`() {
        // given
        every { memberSuspensionService.suspend(any(), any(), any(), any(), any()) } returns suspensionDetail()
        val event = event(
            AdminCommands.SUSPEND,
            mapOf("회원id" to MEMBER_ID, "유형" to "SERVICE", "사유" to "ABUSE", "기간" to 0L),
        )

        // when
        listener.onSlashCommandInteraction(event)

        // then
        verify { memberSuspensionService.suspend(MEMBER_ID, any(), any(), null, any()) }
    }

    @Test
    fun `초기화 명령이 프로필을 초기화한다`() {
        // given
        every { memberAdminService.resetProfile(MEMBER_ID, ProfileTarget.COMMENT) } returns "홍길동"
        val event = event(AdminCommands.RESET, mapOf("회원id" to MEMBER_ID, "항목" to "COMMENT"))

        // when
        listener.onSlashCommandInteraction(event)

        // then
        verify { memberAdminService.resetProfile(MEMBER_ID, ProfileTarget.COMMENT) }
        assertThat(replied()).contains("홍길동", "초기화")
    }

    @Test
    fun `신고처리 명령이 신고를 처리한다`() {
        // given
        val event = event(AdminCommands.HANDLE, mapOf("신고id" to REPORT_ID))

        // when
        listener.onSlashCommandInteraction(event)

        // then
        verify { reportService.handle(REPORT_ID) }
        assertThat(replied()).contains("처리 완료")
    }

    @Test
    fun `미처리 신고가 없으면 안내한다`() {
        // given
        every { reportService.findPending() } returns emptyList()
        val event = event(AdminCommands.REPORTS)

        // when
        listener.onSlashCommandInteraction(event)

        // then
        assertThat(replied()).contains("미처리 신고가 없습니다.")
    }

    @Test
    fun `사진이 없으면 안내한다`() {
        // given
        every { memberAdminService.findPhotoUrls(MEMBER_ID, PhotoVisibility.PUBLIC) } returns emptyList()
        val event = event(
            AdminCommands.MEMBER,
            mapOf("회원id" to MEMBER_ID, "항목" to MemberView.PUBLIC_PHOTO.name),
        )

        // when
        listener.onSlashCommandInteraction(event)

        // then
        assertThat(replied()).contains("사진이 없습니다.")
    }

    @Test
    fun `업무 예외는 그 문구로 답한다`() {
        // given
        every { reportService.handle(REPORT_ID) } throws BusinessException(ErrorCode.REPORT_NOT_FOUND)
        val event = event(AdminCommands.HANDLE, mapOf("신고id" to REPORT_ID))

        // when
        listener.onSlashCommandInteraction(event)

        // then
        assertThat(replied()).contains(ErrorCode.REPORT_NOT_FOUND.message)
    }

    @Test
    fun `그 밖의 예외는 실패 문구로 답한다`() {
        // given
        every { reportService.handle(REPORT_ID) } throws IllegalStateException("터짐")
        val event = event(AdminCommands.HANDLE, mapOf("신고id" to REPORT_ID))

        // when
        listener.onSlashCommandInteraction(event)

        // then
        assertThat(replied()).contains("처리하지 못했습니다.")
    }

    private fun replied(): String {
        val messages = mutableListOf<String>()
        verify { hook.sendMessage(capture(messages)) }

        return messages.joinToString("\n")
    }

    private fun event(
        name: String,
        options: Map<String, Any> = emptyMap(),
        hasRole: Boolean = true,
    ): SlashCommandInteractionEvent {
        val role = mockk<Role>()
        every { role.id } returns if (hasRole) ROLE_ID else "other-role"

        val member = mockk<DiscordMember>()
        every { member.roles } returns listOf(role)

        val user = mockk<User>(relaxed = true)
        every { user.effectiveName } returns "운영자"
        every { user.effectiveAvatarUrl } returns "https://cdn.test/avatar.png"

        val event = mockk<SlashCommandInteractionEvent>(relaxed = true)
        every { event.name } returns name
        every { event.member } returns member
        every { event.user } returns user
        every { event.hook } returns hook
        every { event.getOption(any()) } returns null

        options.forEach { (key, value) ->
            val option = mockk<OptionMapping>(relaxed = true)

            if (value is Long) {
                every { option.asLong } returns value
            } else {
                every { option.asString } returns value.toString()
            }

            every { event.getOption(key) } returns option
        }

        return event
    }

    private fun suspensionDetail() = SuspensionDetail(
        id = 1L,
        memberId = MEMBER_ID,
        nickname = "홍길동",
        withdrawn = false,
        type = SuspensionType.SERVICE,
        reason = SuspensionReason.ABUSE,
        startedAt = NOW,
        expiresAt = null,
        releasedAt = null,
        detail = null,
    )

    private fun discordProperties() = DiscordProperties(
        token = "token",
        guildId = "guild",
        roleId = ROLE_ID,
        suspensionChannelId = "suspension",
        resetChannelId = "reset",
        reportChannelId = "report",
        moderationChannelId = "moderation",
        errorChannelId = "error",
    )

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-16T12:00:00Z")

        private const val ROLE_ID = "1524078559369625620"
        private const val MEMBER_ID = 7L
        private const val REPORT_ID = 100L
    }
}
