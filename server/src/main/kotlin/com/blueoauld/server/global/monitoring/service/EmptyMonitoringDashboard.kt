package com.blueoauld.server.global.monitoring.service

import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import com.blueoauld.server.global.monitoring.dto.MonitoringSnapshot
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import java.time.Clock

@Component
@ConditionalOnExpression("'\${cloudwatch.dashboard-name:}'.isEmpty()")
class EmptyMonitoringDashboard(

    private val clock: Clock,
) : MonitoringDashboard {

    override val configured = false

    override fun snapshot(range: MonitoringRange) = MonitoringSnapshot(
        widgets = emptyList(),
        refreshedAt = clock.instant(),
    )
}
