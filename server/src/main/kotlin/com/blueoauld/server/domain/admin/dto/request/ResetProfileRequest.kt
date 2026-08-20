package com.blueoauld.server.domain.admin.dto.request

import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import jakarta.validation.constraints.NotNull

data class ResetProfileRequest(

    @field:NotNull(message = "초기화 항목이 올바르지 않습니다.")
    val target: ProfileTarget? = null,
)
