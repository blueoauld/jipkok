package com.blueoauld.server.domain.admin.dto.request

import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import jakarta.validation.constraints.NotNull

data class ReleaseSuspensionRequest(

    @field:NotNull(message = "회원 ID가 올바르지 않습니다.")
    val memberId: Long? = null,

    @field:NotNull(message = "정지 유형이 올바르지 않습니다.")
    val type: SuspensionType? = null,
)
