package com.blueoauld.server.domain.admin.dto.response

import java.time.Instant

data class AdminMonitoringResponse(

    val configured: Boolean,
    val refreshedAt: Instant,
    val widgets: List<AdminMonitoringWidgetResponse>,
)

data class AdminMonitoringWidgetResponse(

    val title: String?,
    val width: Int,
    val height: Int,
    val image: String,
)
