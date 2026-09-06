package com.blueoauld.server.global.monitoring.service

import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.ObjectMapper

class CloudWatchMetricQueriesTest {

    private val objectMapper = ObjectMapper()

    @Test
    fun `대시보드 지표 배열을 축약 표기까지 풀어 쿼리로 만든다`() {
        // given
        val properties = objectMapper.readTree(
            """{"period":60,"stat":"Maximum","metrics":[""" +
                """["CWAgent","mem_used_percent","host","ip-1",{"id":"m1","label":"메모리","color":"#1f77b4"}],""" +
                """[".","cpu_usage_active",".",".",{"stat":"Average","visible":false}],""" +
                """["...","ip-2"],""" +
                """[{"expression":"m1/2","label":"절반","id":"e1"}]""" +
                """]}""",
        )

        // when
        val queries = CloudWatchMetricQueries.of(properties, MonitoringRange.H3)

        // then
        assertThat(queries).hasSize(4)

        val first = queries[0].query
        assertThat(first.id()).isEqualTo("m1")
        assertThat(first.label()).isEqualTo("메모리")
        assertThat(first.returnData()).isTrue()
        assertThat(first.metricStat().metric().namespace()).isEqualTo("CWAgent")
        assertThat(first.metricStat().metric().metricName()).isEqualTo("mem_used_percent")
        assertThat(first.metricStat().metric().dimensions().single().name()).isEqualTo("host")
        assertThat(first.metricStat().metric().dimensions().single().value()).isEqualTo("ip-1")
        assertThat(first.metricStat().stat()).isEqualTo("Maximum")
        assertThat(first.metricStat().period()).isEqualTo(60)
        assertThat(queries[0].color).isEqualTo("#1f77b4")

        val second = queries[1].query
        assertThat(second.id()).isEqualTo("q1")
        assertThat(second.returnData()).isFalse()
        assertThat(second.metricStat().metric().namespace()).isEqualTo("CWAgent")
        assertThat(second.metricStat().metric().metricName()).isEqualTo("cpu_usage_active")
        assertThat(second.metricStat().metric().dimensions().single().value()).isEqualTo("ip-1")
        assertThat(second.metricStat().stat()).isEqualTo("Average")

        val third = queries[2].query
        assertThat(third.metricStat().metric().metricName()).isEqualTo("cpu_usage_active")
        assertThat(third.metricStat().metric().dimensions().single().name()).isEqualTo("host")
        assertThat(third.metricStat().metric().dimensions().single().value()).isEqualTo("ip-2")

        val expression = queries[3].query
        assertThat(expression.id()).isEqualTo("e1")
        assertThat(expression.expression()).isEqualTo("m1/2")
        assertThat(expression.label()).isEqualTo("절반")
        assertThat(expression.period()).isEqualTo(60)
        assertThat(expression.metricStat()).isNull()
    }

    @Test
    fun `기간이 길면 집계 주기를 기간의 최소 주기까지 올린다`() {
        // given
        val properties = objectMapper.readTree("""{"period":60,"metrics":[["AWS/EC2","CPUUtilization"]]}""")

        // when
        val week = CloudWatchMetricQueries.of(properties, MonitoringRange.W1).single().query
        val day = CloudWatchMetricQueries.of(properties, MonitoringRange.D1).single().query

        // then
        assertThat(week.metricStat().period()).isEqualTo(3600)
        assertThat(day.metricStat().period()).isEqualTo(300)
        assertThat(week.metricStat().stat()).isEqualTo("Average")
    }
}
