package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.admin.dto.projection.AiGreetingStatRow
import com.blueoauld.server.domain.admin.dto.projection.AiGreetingTotalRow
import com.blueoauld.server.domain.admin.dto.projection.AiReplyStatRow
import com.blueoauld.server.domain.admin.dto.projection.AiReplyTotalRow
import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.member.dto.response.ProfilePhotoResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import java.time.Instant

data class AdminAiMemberPageResponse(

    val items: List<AdminAiMemberResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
    val todayTotal: AdminAiReplyStatResponse,
    val globalDailyLimit: Long,
    val globalDailyGreetingLimit: Long,
)

data class AdminAiMemberResponse(

    val id: Long,
    val nickname: String,
    val gender: Gender,
    val age: Int,
    val enabled: Boolean,
    val greetingEnabled: Boolean,
    val publicPhotoCount: Int,
    val locatedAt: Instant?,
    val createdAt: Instant,
    val today: AdminAiReplyStatResponse,
    val total: AdminAiReplyStatResponse,
)

data class AdminAiMemberDetailResponse(

    val id: Long,
    val nickname: String,
    val gender: Gender,
    val birthYear: Int,
    val age: Int,
    val comment: String?,
    val bio: String?,
    val latitude: Double?,
    val longitude: Double?,
    val locatedAt: Instant?,
    val receivedLikeCount: Int,
    val publicPhotos: List<ProfilePhotoResponse>,
    val secretPhotos: List<ProfilePhotoResponse>,
    val persona: AdminAiPersonaResponse,
    val today: AdminAiReplyStatResponse,
    val total: AdminAiReplyStatResponse,
    val createdAt: Instant,
    val updatedAt: Instant,
) {

    companion object {

        fun of(
            member: Member,
            persona: AiPersona,
            age: Int,
            publicPhotos: List<ProfilePhotoResponse>,
            secretPhotos: List<ProfilePhotoResponse>,
            today: AdminAiReplyStatResponse,
            total: AdminAiReplyStatResponse,
        ) = AdminAiMemberDetailResponse(
            id = member.id,
            nickname = member.nickname,
            gender = member.gender,
            birthYear = member.birthYear,
            age = age,
            comment = member.comment,
            bio = member.bio,
            latitude = member.latitude,
            longitude = member.longitude,
            locatedAt = member.locatedAt,
            receivedLikeCount = member.receivedLikeCount,
            publicPhotos = publicPhotos,
            secretPhotos = secretPhotos,
            persona = AdminAiPersonaResponse.of(persona),
            today = today,
            total = total,
            createdAt = member.createdAt,
            updatedAt = maxOf(member.updatedAt, persona.updatedAt),
        )
    }
}

data class AdminAiPersonaResponse(

    val enabled: Boolean,
    val systemPrompt: String,
    val replyDelayMinSeconds: Int,
    val replyDelayMaxSeconds: Int,
    val activeStartHour: Int,
    val activeEndHour: Int,
    val dailyReplyLimit: Int,
    val greetingEnabled: Boolean,
    val dailyGreetingLimit: Int,
    val nextLocationRefreshAt: Instant,
) {

    companion object {

        fun of(persona: AiPersona) = AdminAiPersonaResponse(
            enabled = persona.enabled,
            systemPrompt = persona.systemPrompt,
            replyDelayMinSeconds = persona.replyDelayMinSeconds,
            replyDelayMaxSeconds = persona.replyDelayMaxSeconds,
            activeStartHour = persona.activeStartHour,
            activeEndHour = persona.activeEndHour,
            dailyReplyLimit = persona.dailyReplyLimit,
            greetingEnabled = persona.greetingEnabled,
            dailyGreetingLimit = persona.dailyGreetingLimit,
            nextLocationRefreshAt = persona.nextLocationRefreshAt,
        )
    }
}

data class AdminAiReplyStatResponse(

    val replyCount: Long,
    val tokenCount: Long,
    val cachedTokenCount: Long,
    val greetingCount: Long,
    val greetingReplyCount: Long,
) {

    companion object {

        val EMPTY = AdminAiReplyStatResponse(0, 0, 0, 0, 0)

        fun of(reply: AiReplyStatRow?, greeting: AiGreetingStatRow?) = AdminAiReplyStatResponse(
            replyCount = reply?.replyCount ?: 0,
            tokenCount = reply?.tokenCount ?: 0,
            cachedTokenCount = reply?.cachedTokenCount ?: 0,
            greetingCount = greeting?.greetingCount ?: 0,
            greetingReplyCount = greeting?.greetingReplyCount ?: 0,
        )

        fun of(reply: AiReplyTotalRow, greeting: AiGreetingTotalRow) = AdminAiReplyStatResponse(
            replyCount = reply.replyCount,
            tokenCount = reply.tokenCount,
            cachedTokenCount = reply.cachedTokenCount,
            greetingCount = greeting.greetingCount,
            greetingReplyCount = greeting.greetingReplyCount,
        )
    }
}

data class AdminAiTestChatResponse(

    val content: String,
    val promptTokens: Int,
    val completionTokens: Int,
    val cachedTokens: Int,
    val model: String?,
) {

    companion object {

        fun of(reply: AiReply) = AdminAiTestChatResponse(
            content = reply.content,
            promptTokens = reply.promptTokens,
            completionTokens = reply.completionTokens,
            cachedTokens = reply.cachedTokens,
            model = reply.model,
        )
    }
}
