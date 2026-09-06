package com.blueoauld.server.global.monitoring.service

import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import software.amazon.awssdk.services.cloudwatch.model.Dimension
import software.amazon.awssdk.services.cloudwatch.model.Metric
import software.amazon.awssdk.services.cloudwatch.model.MetricDataQuery
import software.amazon.awssdk.services.cloudwatch.model.MetricStat
import tools.jackson.databind.JsonNode

object CloudWatchMetricQueries {

    data class Query(val query: MetricDataQuery, val color: String?)

    fun of(widgetProperties: JsonNode?, range: MonitoringRange): List<Query> {
        val rows = widgetProperties?.get(METRICS)?.filter { it.isArray }.orEmpty()
        val widgetStat = widgetProperties?.get(STAT)?.asText() ?: DEFAULT_STAT
        val widgetPeriod = widgetProperties?.get(PERIOD)?.asInt() ?: DEFAULT_PERIOD

        var previous: List<String> = emptyList()

        return rows.mapIndexed { index, row ->
            val values = row.filter { it.isTextual }.map { it.asText() }
            val options = row.firstOrNull { it.isObject }
            val id = options?.get(ID)?.asText()?.takeIf { it.isNotBlank() } ?: "$GENERATED_ID_PREFIX$index"
            val period = periodOf(options?.get(PERIOD)?.asInt() ?: widgetPeriod, range)
            val label = options?.get(LABEL)?.asText()
            val builder = MetricDataQuery.builder()
                .id(id)
                .returnData(options?.get(VISIBLE)?.asBoolean() != false)
                .label(label)

            val expression = options?.get(EXPRESSION)?.asText()

            if (expression != null) {
                builder.expression(expression).period(period)
            } else {
                val resolved = resolve(values, previous)
                previous = resolved

                builder.metricStat(
                    MetricStat.builder()
                        .metric(metricOf(resolved))
                        .period(period)
                        .stat(options?.get(STAT)?.asText() ?: widgetStat)
                        .build(),
                )
            }

            Query(query = builder.build(), color = options?.get(COLOR)?.asText())
        }
    }

    fun periodOf(period: Int, range: MonitoringRange): Int = maxOf(period, range.minPeriodSeconds)

    private fun resolve(values: List<String>, previous: List<String>): List<String> {
        val expanded = values.flatMapIndexed { index, value ->
            if (value == REPEAT_PREFIX) previous.dropLast(values.size - index - 1) else listOf(value)
        }

        return expanded.mapIndexed { index, value ->
            if (value == SAME_AS_PREVIOUS) previous.getOrElse(index) { value } else value
        }
    }

    private fun metricOf(values: List<String>): Metric {
        val dimensions = values.drop(2).chunked(2)
            .filter { it.size == 2 }
            .map { (name, value) -> Dimension.builder().name(name).value(value).build() }

        return Metric.builder()
            .namespace(values.getOrNull(0))
            .metricName(values.getOrNull(1))
            .dimensions(dimensions)
            .build()
    }

    private const val METRICS = "metrics"
    private const val STAT = "stat"
    private const val PERIOD = "period"
    private const val ID = "id"
    private const val LABEL = "label"
    private const val VISIBLE = "visible"
    private const val EXPRESSION = "expression"
    private const val COLOR = "color"
    private const val DEFAULT_STAT = "Average"
    private const val DEFAULT_PERIOD = 300
    private const val GENERATED_ID_PREFIX = "q"
    private const val SAME_AS_PREVIOUS = "."
    private const val REPEAT_PREFIX = "..."
}
