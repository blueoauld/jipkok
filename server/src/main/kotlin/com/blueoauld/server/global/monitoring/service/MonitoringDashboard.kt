package com.blueoauld.server.global.monitoring.service

import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import com.blueoauld.server.global.monitoring.dto.MonitoringSnapshot

interface MonitoringDashboard {

    val configured: Boolean

    fun snapshot(range: MonitoringRange): MonitoringSnapshot
}
