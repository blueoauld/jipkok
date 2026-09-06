package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.global.monitoring.dto.MonitoringAnnotation
import com.blueoauld.server.global.monitoring.dto.MonitoringPoint
import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import com.blueoauld.server.global.monitoring.dto.MonitoringSeries
import com.blueoauld.server.global.monitoring.dto.MonitoringSnapshot
import com.blueoauld.server.global.monitoring.dto.MonitoringWidget
import com.blueoauld.server.global.monitoring.dto.MonitoringWidgetKind
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
    fun `위젯 구성과 지표 값을 응답으로 옮긴다`() {
        // given
        every { monitoringDashboard.configured } returns true
        every { monitoringDashboard.snapshot(MonitoringRange.H3) } returns MonitoringSnapshot(
            widgets = listOf(
                MonitoringWidget(
                    kind = MonitoringWidgetKind.METRIC,
                    title = "CPU",
                    text = null,
                    view = "timeSeries",
                    stacked = false,
                    period = 60,
                    yAxisMin = 0.0,
                    yAxisMax = null,
                    yAxisLabel = "%",
                    annotations = listOf(MonitoringAnnotation(label = "기준선", value = 85.0, color = null)),
                    series = listOf(
                        MonitoringSeries(
                            id = "m1",
                            label = "cpu",
                            color = null,
                            points = listOf(MonitoringPoint(time = NOW, value = 12.5)),
                        ),
                    ),
                    width = 12,
                    height = 6,
                ),
            ),
            start = NOW.minusSeconds(3600),
            end = NOW,
            refreshedAt = NOW,
        )

        // when
        val response = service.findWidgets(MonitoringRange.H3)

        // then
        assertThat(response.configured).isTrue()
        assertThat(response.end).isEqualTo(NOW)
        val widget = response.widgets.single()
        assertThat(widget.title).isEqualTo("CPU")
        assertThat(widget.yAxisLabel).isEqualTo("%")
        assertThat(widget.annotations.single().value).isEqualTo(85.0)
        assertThat(widget.series.single().points.single().value).isEqualTo(12.5)
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-09-06T12:00:00Z")
    }
}
