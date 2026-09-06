package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.response.AdminMonitoringAnnotationResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMonitoringPointResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMonitoringResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMonitoringSeriesResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMonitoringWidgetResponse
import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import com.blueoauld.server.global.monitoring.service.MonitoringDashboard
import org.springframework.stereotype.Service

@Service
class AdminMonitoringService(

    private val monitoringDashboard: MonitoringDashboard,
) {

    fun findWidgets(range: MonitoringRange): AdminMonitoringResponse {
        val snapshot = monitoringDashboard.snapshot(range)

        return AdminMonitoringResponse(
            configured = monitoringDashboard.configured,
            start = snapshot.start,
            end = snapshot.end,
            refreshedAt = snapshot.refreshedAt,
            widgets = snapshot.widgets.map { widget ->
                AdminMonitoringWidgetResponse(
                    kind = widget.kind,
                    title = widget.title,
                    text = widget.text,
                    view = widget.view,
                    stacked = widget.stacked,
                    period = widget.period,
                    yAxisMin = widget.yAxisMin,
                    yAxisMax = widget.yAxisMax,
                    yAxisLabel = widget.yAxisLabel,
                    annotations = widget.annotations.map {
                        AdminMonitoringAnnotationResponse(label = it.label, value = it.value, color = it.color)
                    },
                    series = widget.series.map { series ->
                        AdminMonitoringSeriesResponse(
                            id = series.id,
                            label = series.label,
                            color = series.color,
                            points = series.points.map {
                                AdminMonitoringPointResponse(time = it.time, value = it.value)
                            },
                        )
                    },
                    width = widget.width,
                    height = widget.height,
                )
            },
        )
    }
}
