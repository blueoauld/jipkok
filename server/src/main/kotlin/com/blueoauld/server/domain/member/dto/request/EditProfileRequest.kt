package com.blueoauld.server.domain.member.dto.request

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class EditProfileRequest(

    @field:NotBlank(message = "닉네임이 올바르지 않습니다.")
    @field:Size(max = Member.NICKNAME_MAX_LENGTH, message = "닉네임이 올바르지 않습니다.")
    @field:Pattern(regexp = Member.NICKNAME_PATTERN, message = "닉네임이 올바르지 않습니다.")
    val nickname: String,

    val birthYear: Int,

    @field:Size(max = Member.BIO_MAX_LENGTH, message = "자기소개가 너무 깁니다.")
    val bio: String? = null,

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
