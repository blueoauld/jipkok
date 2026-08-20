package com.blueoauld.server.domain.admin.dto.response

data class AdminSuspensionPageResponse(

    val items: List<AdminSuspensionResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)
