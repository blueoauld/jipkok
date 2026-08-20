package com.blueoauld.server.domain.admin.dto.request

import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class CreateSuspensionRequest(

    @field:NotNull(message = "회원 ID가 올바르지 않습니다.")
    val memberId: Long? = null,

    @field:NotNull(message = "정지 유형이 올바르지 않습니다.")
    val type: SuspensionType? = null,

    @field:NotNull(message = "정지 사유가 올바르지 않습니다.")
    val reason: SuspensionReason? = null,

    @field:Min(value = 1, message = "정지 일수가 올바르지 않습니다.")
    val days: Long? = null,

    @field:Size(max = MemberSuspension.DETAIL_MAX_LENGTH, message = "상세 사유가 너무 깁니다.")
    val detail: String? = null,
)
