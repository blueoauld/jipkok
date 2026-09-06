package com.blueoauld.server.global.monitoring.dto

import java.time.Instant

data class MonitoringWidget(

    val title: String?,
    val width: Int,
    val height: Int,
    val image: ByteArray,
)

data class MonitoringSnapshot(

    val widgets: List<MonitoringWidget>,
    val refreshedAt: Instant,
)
