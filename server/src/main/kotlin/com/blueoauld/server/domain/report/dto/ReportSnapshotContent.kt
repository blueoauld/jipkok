package com.blueoauld.server.domain.report.dto

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.entity.type.Gender
import java.time.Instant

data class ReportSnapshotContent(

    val reporter: ReporterSnapshot,
    val reported: ReportedMemberSnapshot,
    val messages: List<ChatMessageSnapshot> = emptyList(),
)

data class ChatMessageSnapshot(

    val messageId: Long,
    val senderId: Long,
    val type: ChatMessageType,
    val content: String?,
    val photoKey: String?,
    val createdAt: Instant,
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
