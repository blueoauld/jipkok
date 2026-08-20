package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import java.time.Instant

data class AdminReportPageResponse(

    val items: List<AdminReportResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminReportResponse(

    val id: Long,
    val type: ReportType,
    val reason: ReportReason,
    val reporterId: Long,
    val reporterNickname: String,
    val reportedMemberId: Long,
    val reportedNickname: String,
    val createdAt: Instant,
    val handledAt: Instant?,
)

data class AdminReportDetailResponse(

    val id: Long,
    val type: ReportType,
    val reason: ReportReason,
    val detail: String?,
    val createdAt: Instant,
    val handledAt: Instant?,
    val reporter: AdminReporterResponse,
    val reported: AdminReportedMemberResponse,
    val evidencePhotoUrls: List<String>,
    val messages: List<AdminChatMessageResponse>,
)

data class AdminReporterResponse(

    val id: Long,
    val nickname: String,
)

data class AdminReportedMemberResponse(

    val id: Long,
    val nickname: String,
    val phoneNumber: String,
    val gender: Gender,
    val age: Int,
    val comment: String?,
    val bio: String?,
    val profilePhotoUrls: List<String>,
)

data class AdminChatMessageResponse(

    val id: Long,
    val senderId: Long,
    val type: ChatMessageType,
    val content: String?,
    val photoUrl: String?,
    val createdAt: Instant,
)
