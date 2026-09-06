package com.blueoauld.server.global.monitoring.dto

import java.time.Instant

enum class MonitoringWidgetKind {

    METRIC,
    TEXT,
    UNSUPPORTED,
}

data class MonitoringPoint(

    val time: Instant,
    val value: Double,
)

data class MonitoringSeries(

    val id: String,
    val label: String,
    val color: String?,
    val points: List<MonitoringPoint>,
)

data class MonitoringAnnotation(

    val label: String?,
    val value: Double,
    val color: String?,
)

data class MonitoringWidget(

    val kind: MonitoringWidgetKind,
    val title: String?,
    val text: String?,
    val view: String?,
    val stacked: Boolean,
    val period: Int?,
    val yAxisMin: Double?,
    val yAxisMax: Double?,
    val yAxisLabel: String?,
    val annotations: List<MonitoringAnnotation>,
    val series: List<MonitoringSeries>,
    val width: Int,
    val height: Int,
)

data class MonitoringSnapshot(

    val widgets: List<MonitoringWidget>,
    val start: Instant,
    val end: Instant,
    val refreshedAt: Instant,
)
