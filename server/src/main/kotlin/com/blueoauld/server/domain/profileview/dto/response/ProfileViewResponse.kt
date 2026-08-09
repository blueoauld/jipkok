package com.blueoauld.server.domain.profileview.dto.response

import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import java.time.Instant

data class ProfileViewResponse(

    val member: MemberSummaryResponse,
    val viewedAt: Instant,
)
