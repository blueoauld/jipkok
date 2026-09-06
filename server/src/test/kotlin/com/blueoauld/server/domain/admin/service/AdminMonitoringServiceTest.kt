package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import com.blueoauld.server.global.monitoring.dto.MonitoringSnapshot
import com.blueoauld.server.global.monitoring.dto.MonitoringWidget
import com.blueoauld.server.global.monitoring.service.MonitoringDashboard
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant

class AdminMonitoringServiceTest {

    private val monitoringDashboard = mockk<MonitoringDashboard>()

    private val service = AdminMonitoringService(monitoringDashboard)

    @Test
    fun `위젯 이미지를 base64로 옮긴다`() {
        // given
        every { monitoringDashboard.configured } returns true
        every { monitoringDashboard.snapshot(MonitoringRange.H3) } returns MonitoringSnapshot(
            widgets = listOf(MonitoringWidget(title = "CPU", width = 12, height = 6, image = byteArrayOf(1, 2, 3))),
            refreshedAt = NOW,
        )

        // when
        val response = service.findWidgets(MonitoringRange.H3)

        // then
        assertThat(response.configured).isTrue()
        assertThat(response.refreshedAt).isEqualTo(NOW)
        assertThat(response.widgets.single().title).isEqualTo("CPU")
        assertThat(response.widgets.single().image).isEqualTo("AQID")
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-09-06T12:00:00Z")
    }
}
