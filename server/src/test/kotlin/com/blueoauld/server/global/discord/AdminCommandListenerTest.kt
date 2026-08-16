package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.domain.report.service.ReportService
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.properties.DiscordProperties
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import net.dv8tion.jda.api.JDA
import net.dv8tion.jda.api.entities.Guild
import net.dv8tion.jda.api.events.session.ReadyEvent
import net.dv8tion.jda.api.interactions.commands.build.CommandData
import net.dv8tion.jda.api.requests.restaction.CommandListUpdateAction
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.task.SyncTaskExecutor

class AdminCommandListenerTest {

    private val listener = AdminCommandListener(
        mockk<MemberSuspensionService>(relaxed = true),
        mockk<MemberAdminService>(relaxed = true),
        mockk<ReportService>(relaxed = true),
        discordProperties(),
        SyncTaskExecutor(),
    )

    @Test
    fun `연결되면 길드에 명령을 등록한다`() {
        // given
        val updateAction = mockk<CommandListUpdateAction>(relaxed = true)
        val commands = slot<Collection<CommandData>>()
        every { updateAction.addCommands(capture(commands)) } returns updateAction

        val guild = mockk<Guild>()
        every { guild.updateCommands() } returns updateAction

        val jda = mockk<JDA>()
        every { jda.getGuildById(GUILD_ID) } returns guild

        val event = mockk<ReadyEvent>()
        every { event.jda } returns jda

        // when
        listener.onReady(event)

        // then
        verify { updateAction.queue() }
        assertThat(commands.captured.map { it.name })
            .contains(AdminCommandListener.SUSPEND, AdminCommandListener.REPORTS)
    }

    @Test
    fun `길드를 찾지 못하면 명령을 등록하지 않는다`() {
        // given
        val jda = mockk<JDA>()
        every { jda.getGuildById(GUILD_ID) } returns null

        val event = mockk<ReadyEvent>()
        every { event.jda } returns jda

        // when
        listener.onReady(event)

        // then
        verify { jda.getGuildById(GUILD_ID) }
    }

    private fun discordProperties() = DiscordProperties(
        token = "token",
        guildId = GUILD_ID,
        roleId = "role",
        suspensionChannelId = "suspension",
        resetChannelId = "reset",
        reportChannelId = "report",
        moderationChannelId = "moderation",
        errorChannelId = "error",
    )

    companion object {

        private const val GUILD_ID = "1521171822027079774"
    }
}
