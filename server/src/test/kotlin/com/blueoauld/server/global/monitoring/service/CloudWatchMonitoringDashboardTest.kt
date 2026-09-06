package com.blueoauld.server.global.monitoring.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import com.blueoauld.server.global.properties.CloudWatchProperties
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import software.amazon.awssdk.core.SdkBytes
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient
import software.amazon.awssdk.services.cloudwatch.model.GetDashboardRequest
import software.amazon.awssdk.services.cloudwatch.model.GetDashboardResponse
import software.amazon.awssdk.services.cloudwatch.model.GetMetricWidgetImageRequest
import software.amazon.awssdk.services.cloudwatch.model.GetMetricWidgetImageResponse
import tools.jackson.databind.ObjectMapper
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class CloudWatchMonitoringDashboardTest {

    private val client = mockk<CloudWatchClient>()

    private val objectMapper = ObjectMapper()

    @Test
    fun `지표 위젯만 기간과 크기를 붙여 이미지로 그린다`() {
        // given
        every { client.getDashboard(any<GetDashboardRequest>()) } returns
            GetDashboardResponse.builder().dashboardBody(DASHBOARD_BODY).build()
        val requests = mutableListOf<GetMetricWidgetImageRequest>()
        every { client.getMetricWidgetImage(capture(requests)) } returns
            GetMetricWidgetImageResponse.builder().metricWidgetImage(SdkBytes.fromByteArray(PNG)).build()
        val dashboard = dashboard(Clock.fixed(NOW, ZoneOffset.UTC))

        // when
        val snapshot = dashboard.snapshot(MonitoringRange.D1)

        // then
        assertThat(snapshot.refreshedAt).isEqualTo(NOW)
        assertThat(snapshot.widgets).hasSize(1)
        assertThat(snapshot.widgets[0].title).isEqualTo("CPU")
        assertThat(snapshot.widgets[0].width).isEqualTo(12)
        assertThat(snapshot.widgets[0].height).isEqualTo(6)
        assertThat(snapshot.widgets[0].image).isEqualTo(PNG)

        val definition = objectMapper.readTree(requests.single().metricWidget())
        assertThat(definition["start"].asText()).isEqualTo("-P1D")
        assertThat(definition["end"].asText()).isEqualTo("P0D")
        assertThat(definition["width"].asInt()).isEqualTo(12 * CloudWatchMonitoringDashboard.PIXELS_PER_UNIT)
        assertThat(definition["height"].asInt()).isEqualTo(6 * CloudWatchMonitoringDashboard.PIXELS_PER_UNIT)
        assertThat(definition["region"].asText()).isEqualTo("ap-northeast-2")
        assertThat(definition["timezone"].asText()).isEqualTo("+0900")
        assertThat(definition["metrics"].isArray).isTrue()
        assertThat(definition.has("legend")).isFalse()
        assertThat(requests.single().outputFormat()).isEqualTo("png")
    }

    @Test
    fun `60초 안에는 다시 그리지 않는다`() {
        // given
        every { client.getDashboard(any<GetDashboardRequest>()) } returns
            GetDashboardResponse.builder().dashboardBody(DASHBOARD_BODY).build()
        every { client.getMetricWidgetImage(any<GetMetricWidgetImageRequest>()) } returns
            GetMetricWidgetImageResponse.builder().metricWidgetImage(SdkBytes.fromByteArray(PNG)).build()
        val clock = mockk<Clock>()
        every { clock.instant() } returnsMany
            listOf(NOW, NOW.plusSeconds(30), NOW.plus(CloudWatchMonitoringDashboard.CACHE_TTL))
        val dashboard = dashboard(clock)

        // when
        repeat(3) { dashboard.snapshot(MonitoringRange.H3) }

        // then
        verify(exactly = 2) { client.getDashboard(any<GetDashboardRequest>()) }
    }

    @Test
    fun `CloudWatch가 실패하면 모니터링 불가 에러를 낸다`() {
        // given
        every { client.getDashboard(any<GetDashboardRequest>()) } throws IllegalStateException("boom")
        val dashboard = dashboard(Clock.fixed(NOW, ZoneOffset.UTC))

        // when
        val exception = assertThrows(BusinessException::class.java) { dashboard.snapshot(MonitoringRange.H3) }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MONITORING_UNAVAILABLE)
    }

    private fun dashboard(clock: Clock) = CloudWatchMonitoringDashboard(
        CloudWatchProperties(dashboardName = "jipkok", region = "ap-northeast-2"),
        client,
        objectMapper,
        clock,
    )

    companion object {

        private val NOW: Instant = Instant.parse("2026-09-06T12:00:00Z")
        private val PNG = byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47)

        private const val DASHBOARD_BODY = """{"widgets":[""" +
            """{"type":"text","x":0,"y":0,"width":24,"height":1,"properties":{"markdown":"# 집콕"}},""" +
            """{"type":"metric","x":0,"y":1,"width":12,"height":6,"properties":{"title":"CPU","view":"timeSeries",""" +
            """"stacked":false,"metrics":[["AWS/EC2","CPUUtilization","InstanceId","i-1"]],"period":300,""" +
            """"stat":"Average","legend":{"position":"bottom"}}}""" +
            """]}"""
    }
}
