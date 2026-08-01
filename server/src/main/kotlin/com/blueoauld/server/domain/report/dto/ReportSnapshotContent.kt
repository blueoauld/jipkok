package com.blueoauld.server.domain.report.dto

import com.blueoauld.server.domain.member.entity.type.Gender

data class ReportSnapshotContent(

    val reporter: ReporterSnapshot,
    val reported: ReportedMemberSnapshot,
)

data class ReporterSnapshot(

    val memberId: Long,
    val nickname: String,
)

data class ReportedMemberSnapshot(

    val memberId: Long,
    val phoneNumber: String,
    val nickname: String,
    val gender: Gender,
    val birthYear: Int,
    val comment: String?,
    val bio: String?,
    val photoKeys: List<String>,
)
