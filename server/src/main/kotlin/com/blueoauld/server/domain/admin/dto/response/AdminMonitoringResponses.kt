package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.global.monitoring.dto.MonitoringWidgetKind
import java.time.Instant

data class AdminMonitoringResponse(

    val configured: Boolean,
    val start: Instant,
    val end: Instant,
    val refreshedAt: Instant,
    val widgets: List<AdminMonitoringWidgetResponse>,
)

data class AdminMonitoringWidgetResponse(

    val kind: MonitoringWidgetKind,
    val title: String?,
    val text: String?,
    val view: String?,
    val stacked: Boolean,
    val period: Int?,
    val yAxisMin: Double?,
    val yAxisMax: Double?,
    val yAxisLabel: String?,
    val annotations: List<AdminMonitoringAnnotationResponse>,
    val series: List<AdminMonitoringSeriesResponse>,
    val width: Int,
    val height: Int,
)

data class AdminMonitoringAnnotationResponse(

    val label: String?,
    val value: Double,
    val color: String?,
)

data class AdminMonitoringSeriesResponse(

    val id: String,
    val label: String,
    val color: String?,
    val points: List<AdminMonitoringPointResponse>,
)

data class AdminMonitoringPointResponse(

    val time: Instant,
    val value: Double,
)
