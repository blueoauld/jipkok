package com.blueoauld.server.global.monitoring.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.monitoring.dto.MonitoringAnnotation
import com.blueoauld.server.global.monitoring.dto.MonitoringPoint
import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import com.blueoauld.server.global.monitoring.dto.MonitoringSeries
import com.blueoauld.server.global.monitoring.dto.MonitoringSnapshot
import com.blueoauld.server.global.monitoring.dto.MonitoringWidget
import com.blueoauld.server.global.monitoring.dto.MonitoringWidgetKind
import com.blueoauld.server.global.properties.CloudWatchProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient
import software.amazon.awssdk.services.cloudwatch.model.GetDashboardRequest
import software.amazon.awssdk.services.cloudwatch.model.GetMetricDataRequest
import software.amazon.awssdk.services.cloudwatch.model.MetricDataResult
import software.amazon.awssdk.services.cloudwatch.model.ScanBy
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${cloudwatch.dashboard-name:}'.isEmpty()")
class CloudWatchMonitoringDashboard(

    private val properties: CloudWatchProperties,
    private val client: CloudWatchClient,
    private val objectMapper: ObjectMapper,
    private val clock: Clock,
) : MonitoringDashboard {

    override val configured = true

    private val cache = ConcurrentHashMap<MonitoringRange, MonitoringSnapshot>()

    override fun snapshot(range: MonitoringRange): MonitoringSnapshot {
        val now = clock.instant()
        val cached = cache[range]

        if (cached != null && now.isBefore(cached.refreshedAt.plus(CACHE_TTL))) {
            return cached
        }

        return synchronized(this) {
            val latest = cache[range]

            if (latest != null && now.isBefore(latest.refreshedAt.plus(CACHE_TTL))) {
                latest
            } else {
                load(range, now).also { cache[range] = it }
            }
        }
    }

    private fun load(range: MonitoringRange, now: Instant): MonitoringSnapshot = runCatching {
        val body = client.getDashboard(
            GetDashboardRequest.builder().dashboardName(properties.dashboardName).build(),
        ).dashboardBody()
        val start = now.minus(range.duration)
        val widgets = objectMapper.readTree(body)[WIDGETS]?.toList().orEmpty().map { widgetOf(it, range, start, now) }

        MonitoringSnapshot(widgets = widgets, start = start, end = now, refreshedAt = now)
    }.onFailure { log.error(it) { "CloudWatch 대시보드를 읽지 못했다. dashboard=${properties.dashboardName}" } }
        .getOrElse { throw BusinessException(ErrorCode.MONITORING_UNAVAILABLE) }

    private fun widgetOf(widget: JsonNode, range: MonitoringRange, start: Instant, end: Instant): MonitoringWidget {
        val width = widget[WIDTH]?.asInt() ?: DEFAULT_WIDTH
        val height = widget[HEIGHT]?.asInt() ?: DEFAULT_HEIGHT
        val widgetProperties = widget[PROPERTIES]
        val title = widgetProperties?.get(TITLE)?.asText()

        return when (widget[TYPE]?.asText()) {
            METRIC_TYPE -> {
                val queries = CloudWatchMetricQueries.of(widgetProperties, range)
                val leftAxis = widgetProperties?.get(Y_AXIS)?.get(LEFT)

                MonitoringWidget(
                    kind = MonitoringWidgetKind.METRIC,
                    title = title,
                    text = null,
                    view = widgetProperties?.get(VIEW)?.asText(),
                    stacked = widgetProperties?.get(STACKED)?.asBoolean() ?: false,
                    period = queries.firstOrNull()?.query?.let { it.metricStat()?.period() ?: it.period() },
                    yAxisMin = leftAxis?.get(MIN)?.asDouble(),
                    yAxisMax = leftAxis?.get(MAX)?.asDouble(),
                    yAxisLabel = leftAxis?.get(LABEL)?.asText(),
                    annotations = annotationsOf(widgetProperties),
                    series = seriesOf(queries, start, end),
                    width = width,
                    height = height,
                )
            }

            TEXT_TYPE -> placeholder(
                MonitoringWidgetKind.TEXT,
                null,
                widgetProperties?.get(MARKDOWN)?.asText(),
                width,
                height,
            )

            else -> placeholder(MonitoringWidgetKind.UNSUPPORTED, title, null, width, height)
        }
    }

    private fun seriesOf(
        queries: List<CloudWatchMetricQueries.Query>,
        start: Instant,
        end: Instant,
    ): List<MonitoringSeries> {
        if (queries.isEmpty()) {
            return emptyList()
        }

        val results = mutableMapOf<String, MutableList<MonitoringPoint>>()
        val labels = mutableMapOf<String, String>()
        var nextToken: String? = null

        do {
            val response = client.getMetricData(
                GetMetricDataRequest.builder()
                    .metricDataQueries(queries.map { it.query })
                    .startTime(start)
                    .endTime(end)
                    .scanBy(ScanBy.TIMESTAMP_ASCENDING)
                    .nextToken(nextToken)
                    .build(),
            )

            response.metricDataResults().forEach { result ->
                labels.putIfAbsent(result.id(), result.label() ?: result.id())
                results.getOrPut(result.id()) { mutableListOf() } += pointsOf(result)
            }

            nextToken = response.nextToken()
        } while (nextToken != null)

        return queries.filter { it.query.returnData() != false }.map {
            val id = it.query.id()

            MonitoringSeries(
                id = id,
                label = labels[id] ?: it.query.label() ?: id,
                color = it.color,
                points = results[id].orEmpty().sortedBy { point -> point.time },
            )
        }
    }

    private fun pointsOf(result: MetricDataResult): List<MonitoringPoint> =
        result.timestamps().zip(result.values()) { time, value -> MonitoringPoint(time = time, value = value) }

    private fun annotationsOf(widgetProperties: JsonNode?): List<MonitoringAnnotation> {
        val horizontal = widgetProperties?.get(ANNOTATIONS)?.get(HORIZONTAL) ?: return emptyList()

        return horizontal
            .flatMap { annotation -> if (annotation.isArray) annotation.toList() else listOf(annotation) }
            .mapNotNull { annotation ->
                val value = annotation[VALUE]?.takeIf { it.isNumber }?.asDouble() ?: return@mapNotNull null

                MonitoringAnnotation(
                    label = annotation[LABEL]?.asText(),
                    value = value,
                    color = annotation[COLOR]?.asText(),
                )
            }
    }

    private fun placeholder(kind: MonitoringWidgetKind, title: String?, text: String?, width: Int, height: Int) =
        MonitoringWidget(
            kind = kind,
            title = title,
            text = text,
            view = null,
            stacked = false,
            period = null,
            yAxisMin = null,
            yAxisMax = null,
            yAxisLabel = null,
            annotations = emptyList(),
            series = emptyList(),
            width = width,
            height = height,
        )

    companion object {

        val CACHE_TTL: Duration = Duration.ofSeconds(60)

        private const val WIDGETS = "widgets"
        private const val TYPE = "type"
        private const val METRIC_TYPE = "metric"
        private const val TEXT_TYPE = "text"
        private const val PROPERTIES = "properties"
        private const val MARKDOWN = "markdown"
        private const val WIDTH = "width"
        private const val HEIGHT = "height"
        private const val TITLE = "title"
        private const val VIEW = "view"
        private const val STACKED = "stacked"
        private const val Y_AXIS = "yAxis"
        private const val LEFT = "left"
        private const val MIN = "min"
        private const val MAX = "max"
        private const val LABEL = "label"
        private const val ANNOTATIONS = "annotations"
        private const val HORIZONTAL = "horizontal"
        private const val VALUE = "value"
        private const val COLOR = "color"
        private const val DEFAULT_WIDTH = 6
        private const val DEFAULT_HEIGHT = 6
    }
}
