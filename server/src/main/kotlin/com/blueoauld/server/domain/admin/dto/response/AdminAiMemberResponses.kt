package com.blueoauld.server.domain.admin.dto.response

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
)

data class AdminAiMemberResponse(

    val id: Long,
    val nickname: String,
    val gender: Gender,
    val age: Int,
    val enabled: Boolean,
    val publicPhotoCount: Int,
    val locatedAt: Instant?,
    val createdAt: Instant,
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
            nextLocationRefreshAt = persona.nextLocationRefreshAt,
        )
    }
}
