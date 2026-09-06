package com.blueoauld.server.global.monitoring.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import com.blueoauld.server.global.monitoring.dto.MonitoringWidgetKind
import com.blueoauld.server.global.properties.CloudWatchProperties
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient
import software.amazon.awssdk.services.cloudwatch.model.GetDashboardRequest
import software.amazon.awssdk.services.cloudwatch.model.GetDashboardResponse
import software.amazon.awssdk.services.cloudwatch.model.GetMetricDataRequest
import software.amazon.awssdk.services.cloudwatch.model.GetMetricDataResponse
import software.amazon.awssdk.services.cloudwatch.model.MetricDataResult
import tools.jackson.databind.ObjectMapper
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset

class CloudWatchMonitoringDashboardTest {

    private val client = mockk<CloudWatchClient>()

    private val objectMapper = ObjectMapper()

    @Test
    fun `위젯 구성과 기간의 지표 값을 함께 준다`() {
        // given
        every { client.getDashboard(any<GetDashboardRequest>()) } returns
            GetDashboardResponse.builder().dashboardBody(DASHBOARD_BODY).build()
        val requests = mutableListOf<GetMetricDataRequest>()
        every { client.getMetricData(capture(requests)) } returnsMany listOf(
            GetMetricDataResponse.builder()
                .metricDataResults(
                    MetricDataResult.builder().id(
                        "m1",
                    ).label("메모리").timestamps(NOW.minusSeconds(60)).values(41.5).build(),
                    MetricDataResult.builder().id(
                        "q1",
                    ).label("cpu").timestamps(NOW.minusSeconds(60)).values(3.0).build(),
                )
                .nextToken("next")
                .build(),
            GetMetricDataResponse.builder()
                .metricDataResults(MetricDataResult.builder().id("m1").timestamps(NOW).values(42.0).build())
                .build(),
        )
        val dashboard = dashboard(Clock.fixed(NOW, ZoneOffset.UTC))

        // when
        val snapshot = dashboard.snapshot(MonitoringRange.D1)

        // then
        assertThat(snapshot.start).isEqualTo(NOW.minus(Duration.ofDays(1)))
        assertThat(snapshot.end).isEqualTo(NOW)
        assertThat(snapshot.widgets.map { it.kind }).containsExactly(
            MonitoringWidgetKind.TEXT,
            MonitoringWidgetKind.METRIC,
            MonitoringWidgetKind.UNSUPPORTED,
        )
        assertThat(snapshot.widgets[0].text).isEqualTo("# 집콕")
        assertThat(snapshot.widgets[2].title).isEqualTo("서버 로그")

        val metric = snapshot.widgets[1]
        assertThat(metric.title).isEqualTo("메모리 사용률")
        assertThat(metric.view).isEqualTo("timeSeries")
        assertThat(metric.stacked).isFalse()
        assertThat(metric.period).isEqualTo(300)
        assertThat(metric.yAxisMin).isEqualTo(0.0)
        assertThat(metric.yAxisMax).isEqualTo(100.0)
        assertThat(metric.annotations.single().label).isEqualTo("기준선")
        assertThat(metric.annotations.single().value).isEqualTo(85.0)
        assertThat(metric.series.map { it.id }).containsExactly("m1")
        assertThat(metric.series.single().label).isEqualTo("메모리")
        assertThat(metric.series.single().color).isEqualTo("#1f77b4")
        assertThat(metric.series.single().points.map { it.value }).containsExactly(41.5, 42.0)

        assertThat(requests).hasSize(2)
        assertThat(requests[0].startTime()).isEqualTo(NOW.minus(Duration.ofDays(1)))
        assertThat(requests[0].endTime()).isEqualTo(NOW)
        assertThat(requests[0].metricDataQueries().map { it.id() }).containsExactly("m1", "q1")
        assertThat(requests[1].nextToken()).isEqualTo("next")
    }

    @Test
    fun `60초 안에는 다시 읽지 않는다`() {
        // given
        every { client.getDashboard(any<GetDashboardRequest>()) } returns
            GetDashboardResponse.builder().dashboardBody(DASHBOARD_BODY).build()
        every { client.getMetricData(any<GetMetricDataRequest>()) } returns GetMetricDataResponse.builder().build()
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

        private const val DASHBOARD_BODY = """{"widgets":[""" +
            """{"type":"text","x":0,"y":0,"width":24,"height":1,"properties":{"markdown":"# 집콕"}},""" +
            """{"type":"metric","x":0,"y":1,"width":12,"height":6,"properties":{"title":"메모리 사용률",""" +
            """"view":"timeSeries","stacked":false,"period":300,"stat":"Average",""" +
            """"yAxis":{"left":{"min":0,"max":100}},""" +
            """"metrics":[["CWAgent","mem_used_percent","host","ip-1",{"id":"m1","label":"메모리","color":"#1f77b4"}],""" +
            """["CWAgent","cpu_usage_active","host","ip-1",{"visible":false}]],""" +
            """"annotations":{"horizontal":[{"label":"기준선","value":85}]}}},""" +
            """{"type":"log","x":12,"y":1,"width":12,"height":6,""" +
            """"properties":{"title":"서버 로그","query":"fields @message"}}""" +
            """]}"""
    }
}
