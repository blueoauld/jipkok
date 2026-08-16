package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.member.entity.type.MemberView
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.global.properties.DiscordProperties
import net.dv8tion.jda.api.EmbedBuilder
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent
import org.springframework.stereotype.Component

@Component
class MemberCommandHandler(

    private val memberAdminService: MemberAdminService,
    private val discordProperties: DiscordProperties,
) : AdminCommandHandler {

    override fun supports(name: String) = name in COMMAND_NAMES

    override fun handle(event: SlashCommandInteractionEvent): AdminReply =
        if (event.name == AdminCommands.MEMBER) member(event) else reset(event)

    private fun member(event: SlashCommandInteractionEvent): AdminReply {
        val memberId = event.getOption(AdminCommands.MEMBER_ID_OPTION)!!.asLong

        return when (MemberView.valueOf(event.getOption(AdminCommands.TARGET_OPTION)!!.asString)) {
            MemberView.PROFILE -> profile(memberId)
            MemberView.PUBLIC_PHOTO -> photos(memberId, MemberView.PUBLIC_PHOTO, PhotoVisibility.PUBLIC)
            MemberView.SECRET_PHOTO -> photos(memberId, MemberView.SECRET_PHOTO, PhotoVisibility.SECRET)
        }
    }

    private fun photos(memberId: Long, view: MemberView, visibility: PhotoVisibility): AdminReply {
        val urls = memberAdminService.findPhotoUrls(memberId, visibility)

        if (urls.isEmpty()) {
            return AdminReply.Text("사진이 없습니다.")
        }

        return AdminReply.of(view.label, urls.mapIndexed { index, url -> "${index + 1}. $url" }.joinToString("\n"))
    }

    private fun profile(memberId: Long): AdminReply {
        val member = memberAdminService.findForAdmin(memberId)

        val body = listOf(
            "**ID**\n`${member.memberId}`",
            "**닉네임**\n${member.nickname}",
            "**휴대폰**\n`${member.phoneNumber}`",
            "**성별**\n${member.gender.label}",
            "**나이**\n${member.age}살",
            "**좋아요**\n${member.receivedLikeCount}",
            "**공개 사진**\n${member.publicPhotoCount}장",
            "**비밀 사진**\n${member.secretPhotoCount}장",
            "**포인트**\n${member.pointBalance}",
            "**쪽지 수신**\n${mark(member.noteReceiveEnabled)}",
            "**코멘트**\n${member.comment ?: NONE}",
            "**자기소개**\n${member.bio ?: NONE}",
            "**가입일**\n${DiscordEmbeds.format(member.joinedAt)}",
            "**갱신일**\n${member.locatedAt?.let(DiscordEmbeds::format) ?: NONE}",
        ).joinToString("\n\n")

        return AdminReply.of(AdminCommands.MEMBER, body)
    }

    private fun reset(event: SlashCommandInteractionEvent): AdminReply {
        val memberId = event.getOption(AdminCommands.MEMBER_ID_OPTION)!!.asLong
        val target = ProfileTarget.valueOf(event.getOption(AdminCommands.TARGET_OPTION)!!.asString)
        val nickname = memberAdminService.resetProfile(memberId, target)

        val embed = EmbedBuilder()
            .setTitle(AdminCommands.RESET)
            .addField("항목", target.label, false)
            .addField("회원", "$nickname(`$memberId`)", false)
            .setFooter("@${event.user.effectiveName}", event.user.effectiveAvatarUrl)
            .build()

        event.sendTo(discordProperties.resetChannelId, embed)

        return AdminReply.Text("$nickname(`$memberId`) / ${target.label} 초기화")
    }

    private fun mark(enabled: Boolean) = if (enabled) "O" else "X"

    companion object {

        private const val NONE = "없음"

        private val COMMAND_NAMES = setOf(AdminCommands.MEMBER, AdminCommands.RESET)
    }
}
