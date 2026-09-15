package com.blueoauld.server.domain.ai.dto.request

import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.Gender
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class CreateAiMemberRequest(

    @field:NotBlank(message = "닉네임이 올바르지 않습니다.")
    @field:Size(max = Member.NICKNAME_MAX_LENGTH, message = "닉네임이 올바르지 않습니다.")
    @field:Pattern(regexp = Member.NICKNAME_PATTERN, message = "닉네임이 올바르지 않습니다.")
    val nickname: String,

    @field:NotNull(message = "성별이 올바르지 않습니다.")
    val gender: Gender? = null,

    val birthYear: Int,

    @field:Size(max = Member.COMMENT_MAX_LENGTH, message = "코멘트가 너무 깁니다.")
    val comment: String? = null,

    @field:Size(max = Member.BIO_MAX_LENGTH, message = "자기소개가 너무 깁니다.")
    val bio: String? = null,

    @field:NotNull(message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMin(value = "-90.0", message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMax(value = "90.0", message = "위치 정보가 올바르지 않습니다.")
    val latitude: Double? = null,

    @field:NotNull(message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMin(value = "-180.0", message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMax(value = "180.0", message = "위치 정보가 올바르지 않습니다.")
    val longitude: Double? = null,

    @field:Valid
    @field:NotNull(message = "페르소나가 올바르지 않습니다.")
    val persona: AiPersonaRequest? = null,
)

data class UpdateAiMemberRequest(

    @field:NotBlank(message = "닉네임이 올바르지 않습니다.")
    @field:Size(max = Member.NICKNAME_MAX_LENGTH, message = "닉네임이 올바르지 않습니다.")
    @field:Pattern(regexp = Member.NICKNAME_PATTERN, message = "닉네임이 올바르지 않습니다.")
    val nickname: String,

    val birthYear: Int,

    @field:Size(max = Member.COMMENT_MAX_LENGTH, message = "코멘트가 너무 깁니다.")
    val comment: String? = null,

    @field:Size(max = Member.BIO_MAX_LENGTH, message = "자기소개가 너무 깁니다.")
    val bio: String? = null,

    @field:NotNull(message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMin(value = "-90.0", message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMax(value = "90.0", message = "위치 정보가 올바르지 않습니다.")
    val latitude: Double? = null,

    @field:NotNull(message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMin(value = "-180.0", message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMax(value = "180.0", message = "위치 정보가 올바르지 않습니다.")
    val longitude: Double? = null,

    @field:Valid
    @field:NotNull(message = "페르소나가 올바르지 않습니다.")
    val persona: AiPersonaRequest? = null,
)

data class AiPersonaRequest(

    val enabled: Boolean = true,

    @field:NotBlank(message = "페르소나가 올바르지 않습니다.")
    @field:Size(max = AiPersona.SYSTEM_PROMPT_MAX_LENGTH, message = "페르소나가 너무 깁니다.")
    val systemPrompt: String,

    @field:Min(value = 0, message = "응답 지연이 올바르지 않습니다.")
    @field:Max(value = AiPersona.REPLY_DELAY_MAX_SECONDS.toLong(), message = "응답 지연이 올바르지 않습니다.")
    val replyDelayMinSeconds: Int = AiPersona.DEFAULT_REPLY_DELAY_MIN_SECONDS,

    @field:Min(value = 0, message = "응답 지연이 올바르지 않습니다.")
    @field:Max(value = AiPersona.REPLY_DELAY_MAX_SECONDS.toLong(), message = "응답 지연이 올바르지 않습니다.")
    val replyDelayMaxSeconds: Int = AiPersona.DEFAULT_REPLY_DELAY_MAX_SECONDS,

    @field:Min(value = 0, message = "활동 시간이 올바르지 않습니다.")
    @field:Max(value = AiPersona.LAST_HOUR.toLong(), message = "활동 시간이 올바르지 않습니다.")
    val activeStartHour: Int = AiPersona.DEFAULT_ACTIVE_START_HOUR,

    @field:Min(value = 0, message = "활동 시간이 올바르지 않습니다.")
    @field:Max(value = AiPersona.LAST_HOUR.toLong(), message = "활동 시간이 올바르지 않습니다.")
    val activeEndHour: Int = AiPersona.DEFAULT_ACTIVE_END_HOUR,

    @field:Min(value = 0, message = "하루 응답 한도가 올바르지 않습니다.")
    @field:Max(value = AiPersona.DAILY_REPLY_LIMIT_MAX.toLong(), message = "하루 응답 한도가 올바르지 않습니다.")
    val dailyReplyLimit: Int = AiPersona.DEFAULT_DAILY_REPLY_LIMIT,

    val greetingEnabled: Boolean = false,

    @field:Min(value = 0, message = "하루 인사 한도가 올바르지 않습니다.")
    @field:Max(value = AiPersona.DAILY_GREETING_LIMIT_MAX.toLong(), message = "하루 인사 한도가 올바르지 않습니다.")
    val dailyGreetingLimit: Int = AiPersona.DEFAULT_DAILY_GREETING_LIMIT,
)

data class UpdateAiMemberPhotosRequest(

    @field:Size(
        max = MemberPhoto.MAX_COUNT_PER_VISIBILITY,
        message = "공개 사진은 6장까지 올릴 수 있습니다.",
    )
    val publicPhotoKeys: List<String> = emptyList(),

    @field:Size(
        max = MemberPhoto.MAX_COUNT_PER_VISIBILITY,
        message = "비밀 사진은 6장까지 올릴 수 있습니다.",
    )
    val secretPhotoKeys: List<String> = emptyList(),
)
