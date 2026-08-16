package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.member.entity.type.MemberView
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import net.dv8tion.jda.api.interactions.commands.OptionType
import net.dv8tion.jda.api.interactions.commands.build.Commands
import net.dv8tion.jda.api.interactions.commands.build.OptionData
import net.dv8tion.jda.api.interactions.commands.build.SlashCommandData

object AdminCommands {

    const val SUSPEND = "정지"
    const val RELEASE = "정지해제"
    const val HISTORY = "정지조회"
    const val RESET = "초기화"
    const val MEMBER = "회원조회"
    const val REPORT = "신고조회"
    const val REPORTS = "신고목록"
    const val HANDLE = "신고처리"

    const val MEMBER_ID_OPTION = "회원id"
    const val REPORT_ID_OPTION = "신고id"
    const val TYPE_OPTION = "유형"
    const val TARGET_OPTION = "항목"
    const val REASON_OPTION = "사유"
    const val DAYS_OPTION = "기간"
    const val DETAIL_OPTION = "상세"

    fun definitions(): List<SlashCommandData> = listOf(
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
        Commands.slash(REPORT, "신고 내용을 본다.")
            .addOption(OptionType.INTEGER, REPORT_ID_OPTION, "신고 ID", true),
        Commands.slash(REPORTS, "미처리 신고를 본다."),
        Commands.slash(HANDLE, "신고를 처리 완료로 표시한다.")
            .addOption(OptionType.INTEGER, REPORT_ID_OPTION, "신고 ID", true),
        Commands.slash(MEMBER, "회원 정보를 본다.")
            .addOption(OptionType.INTEGER, MEMBER_ID_OPTION, "회원 ID", true)
            .addOptions(viewOption()),
        Commands.slash(RESET, "회원의 프로필을 초기화한다.")
            .addOption(OptionType.INTEGER, MEMBER_ID_OPTION, "회원 ID", true)
            .addOptions(targetOption()),
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

    private fun viewOption() =
        OptionData(
            OptionType.STRING,
            TARGET_OPTION,
            "볼 항목",
            true,
        ).apply {
            MemberView.entries.forEach { addChoice(it.label, it.name) }
        }

    private fun targetOption() =
        OptionData(
            OptionType.STRING,
            TARGET_OPTION,
            "초기화할 항목",
            true,
        ).apply {
            ProfileTarget.entries.forEach { addChoice(it.label, it.name) }
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
