package com.blueoauld.server.domain.point.dto.response

data class PointRewardResponse(

    val earned: Boolean,
    val amount: Int,
    val balance: Int,
)
