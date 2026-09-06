package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.response.AdminMonitoringResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMonitoringWidgetResponse
import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import com.blueoauld.server.global.monitoring.service.MonitoringDashboard
import org.springframework.stereotype.Service
import java.util.*

@Service
class AdminMonitoringService(

    private val monitoringDashboard: MonitoringDashboard,
) {

    fun findWidgets(range: MonitoringRange): AdminMonitoringResponse {
        val snapshot = monitoringDashboard.snapshot(range)

        return AdminMonitoringResponse(
            configured = monitoringDashboard.configured,
            refreshedAt = snapshot.refreshedAt,
            widgets = snapshot.widgets.map {
                AdminMonitoringWidgetResponse(
                    title = it.title,
                    width = it.width,
                    height = it.height,
                    image = Base64.getEncoder().encodeToString(it.image),
                )
            },
        )
    }
}
