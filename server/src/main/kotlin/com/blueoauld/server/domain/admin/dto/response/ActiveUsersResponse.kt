package com.blueoauld.server.domain.admin.dto.response

import java.time.LocalDate

data class ActiveUsersResponse(

    val dau: Long,
    val wau: Long,
    val mau: Long,
    val trend: List<DauPointResponse>,
)

data class DauPointResponse(

    val date: LocalDate,
    val dau: Long,
)
