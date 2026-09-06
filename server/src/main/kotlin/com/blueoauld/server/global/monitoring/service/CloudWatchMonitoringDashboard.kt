package com.blueoauld.server.global.monitoring.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import com.blueoauld.server.global.monitoring.dto.MonitoringSnapshot
import com.blueoauld.server.global.monitoring.dto.MonitoringWidget
import com.blueoauld.server.global.properties.CloudWatchProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient
import software.amazon.awssdk.services.cloudwatch.model.GetDashboardRequest
import software.amazon.awssdk.services.cloudwatch.model.GetMetricWidgetImageRequest
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.node.ObjectNode
import java.time.Clock
import java.time.Duration
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
                MonitoringSnapshot(widgets = render(range), refreshedAt = now).also { cache[range] = it }
            }
        }
    }

    private fun render(range: MonitoringRange): List<MonitoringWidget> = runCatching {
        val body = client.getDashboard(
            GetDashboardRequest.builder().dashboardName(properties.dashboardName).build(),
        ).dashboardBody()

        objectMapper.readTree(body)[WIDGETS]?.filter { it[TYPE]?.asText() == METRIC_TYPE }.orEmpty().map { widget ->
            val width = widget[WIDTH]?.asInt() ?: DEFAULT_WIDTH
            val height = widget[HEIGHT]?.asInt() ?: DEFAULT_HEIGHT
            val definition = definitionOf(widget[PROPERTIES], range, width, height)

            val image = client.getMetricWidgetImage(
                GetMetricWidgetImageRequest.builder()
                    .metricWidget(objectMapper.writeValueAsString(definition))
                    .outputFormat(PNG)
                    .build(),
            ).metricWidgetImage().asByteArray()

            MonitoringWidget(
                title = definition[TITLE]?.asText(),
                width = width,
                height = height,
                image = image,
            )
        }
    }.onFailure { log.error(it) { "CloudWatch 대시보드를 그리지 못했다. dashboard=${properties.dashboardName}" } }
        .getOrElse { throw BusinessException(ErrorCode.MONITORING_UNAVAILABLE) }

    private fun definitionOf(propertiesNode: JsonNode?, range: MonitoringRange, width: Int, height: Int): ObjectNode {
        val definition = objectMapper.createObjectNode()

        propertiesNode?.properties()?.forEach { (key, value) ->
            if (key in SUPPORTED_PROPERTIES) {
                definition.set(key, value)
            }
        }

        if (!definition.has(REGION)) {
            definition.put(REGION, properties.region)
        }

        definition.put(START, range.start)
        definition.put(END, END_NOW)
        definition.put(WIDTH, width * PIXELS_PER_UNIT)
        definition.put(HEIGHT, height * PIXELS_PER_UNIT)
        definition.put(TIMEZONE, TIMEZONE_KOREA)

        return definition
    }

    companion object {

        val CACHE_TTL: Duration = Duration.ofSeconds(60)

        const val PIXELS_PER_UNIT = 50

        private const val WIDGETS = "widgets"
        private const val TYPE = "type"
        private const val METRIC_TYPE = "metric"
        private const val PROPERTIES = "properties"
        private const val WIDTH = "width"
        private const val HEIGHT = "height"
        private const val TITLE = "title"
        private const val REGION = "region"
        private const val START = "start"
        private const val END = "end"
        private const val END_NOW = "P0D"
        private const val TIMEZONE = "timezone"
        private const val TIMEZONE_KOREA = "+0900"
        private const val PNG = "png"
        private const val DEFAULT_WIDTH = 6
        private const val DEFAULT_HEIGHT = 6

        private val SUPPORTED_PROPERTIES = setOf(
            "metrics",
            "period",
            "stat",
            "title",
            "view",
            "stacked",
            "yAxis",
            "annotations",
            "region",
            "liveData",
            "sparkline",
            "setPeriodToTimeRange",
            "trend",
            "singleValueFullPrecision",
        )
    }
}
