package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsCampaignInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsDailyMetrics
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordDailyRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsOrg
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermDailyRow
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.AppleAdsProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.http.HttpHeaders
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import java.math.BigDecimal
import java.time.Duration
import java.time.LocalDate

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${apple-ads.client-id:}'.isEmpty()")
class AppleAdsApiClient(

    private val properties: AppleAdsProperties,
    private val tokenProvider: AppleAdsTokenProvider,
) : AppleAdsClient {

    private val restClient = RestClient.builder()
        .baseUrl(properties.apiUrl)
        .requestFactory(
            SimpleClientHttpRequestFactory().apply {
                setConnectTimeout(CONNECT_TIMEOUT)
                setReadTimeout(READ_TIMEOUT)
            },
        )
        .build()

    override fun findOrgs(): List<AppleAdsOrg> {
        val token = tokenProvider.accessToken()

        val response = call("애플 광고 조직 목록을 불러오지 못했다.") {
            restClient.get()
                .uri(ACLS_PATH)
                .headers { it.setBearerAuth(token) }
                .retrieve()
                .body<AclResponse>()
        }

        return response.data.orEmpty().map {
            AppleAdsOrg(
                orgId = it.orgId,
                orgName = it.orgName.orEmpty(),
                currency = it.currency,
                timeZone = it.timeZone,
                roleNames = it.roleNames.orEmpty(),
            )
        }
    }

    override fun findCampaigns(): List<AppleAdsCampaignInfo> {
        val headers = orgHeaders()

        val response = call("애플 광고 캠페인 목록을 불러오지 못했다.") {
            restClient.get()
                .uri("$CAMPAIGNS_PATH?limit=$PAGE_SIZE")
                .headers { it.addAll(headers) }
                .retrieve()
                .body<CampaignListResponse>()
        }

        return response.data.orEmpty().map {
            AppleAdsCampaignInfo(
                id = it.id,
                name = it.name.orEmpty(),
                status = it.status,
                deleted = it.deleted ?: false,
            )
        }
    }

    override fun findKeywordDailyRows(
        campaignId: Long,
        startDate: LocalDate,
        endDate: LocalDate,
    ): List<AppleAdsKeywordDailyRow> =
        reportRows("$REPORTS_PATH/$campaignId/keywords", startDate, endDate).flatMap { row ->
            val metadata = row.metadata ?: return@flatMap emptyList()
            val keywordId = metadata.keywordId ?: return@flatMap emptyList()
            val adGroupId = metadata.adGroupId ?: return@flatMap emptyList()

            row.granularity.orEmpty().mapNotNull { metrics ->
                toMetrics(metrics)?.let {
                    AppleAdsKeywordDailyRow(
                        keywordId = keywordId,
                        keyword = metadata.keyword.orEmpty(),
                        matchType = metadata.matchType,
                        keywordStatus = metadata.keywordStatus,
                        bidAmount = metadata.bidAmount?.amount?.toBigDecimalOrNull(),
                        adGroupId = adGroupId,
                        adGroupName = metadata.adGroupName,
                        metrics = it,
                    )
                }
            }
        }

    override fun findSearchTermDailyRows(
        campaignId: Long,
        startDate: LocalDate,
        endDate: LocalDate,
    ): List<AppleAdsSearchTermDailyRow> =
        reportRows("$REPORTS_PATH/$campaignId/searchterms", startDate, endDate).flatMap { row ->
            if (row.other == true) {
                return@flatMap emptyList()
            }

            val metadata = row.metadata ?: return@flatMap emptyList()
            val searchTerm = metadata.searchTermText ?: return@flatMap emptyList()
            val adGroupId = metadata.adGroupId ?: return@flatMap emptyList()

            row.granularity.orEmpty().mapNotNull { metrics ->
                toMetrics(metrics)?.let {
                    AppleAdsSearchTermDailyRow(
                        searchTerm = searchTerm,
                        searchTermSource = metadata.searchTermSource,
                        countryOrRegion = metadata.countryOrRegion,
                        keywordId = metadata.keywordId,
                        keyword = metadata.keyword,
                        matchType = metadata.matchType,
                        adGroupId = adGroupId,
                        adGroupName = metadata.adGroupName,
                        metrics = it,
                    )
                }
            }
        }

    private fun reportRows(path: String, startDate: LocalDate, endDate: LocalDate): List<ReportRow> {
        val headers = orgHeaders()
        val rows = mutableListOf<ReportRow>()
        var offset = 0

        while (true) {
            val request = ReportRequest(
                startTime = startDate.toString(),
                endTime = endDate.toString(),
                selector = ReportSelector(pagination = ReportPagination(offset = offset, limit = PAGE_SIZE)),
            )

            val response = call("애플 광고 리포트를 불러오지 못했다. path=$path") {
                restClient.post()
                    .uri(path)
                    .headers { it.addAll(headers) }
                    .body(request)
                    .retrieve()
                    .body<ReportResponse>()
            }

            val page = response.data?.reportingDataResponse?.row.orEmpty()
            rows += page

            if (page.size < PAGE_SIZE) {
                return rows
            }

            offset += PAGE_SIZE
        }
    }

    private fun toMetrics(row: ReportMetrics): AppleAdsDailyMetrics? {
        val date = row.date?.let { runCatching { LocalDate.parse(it) }.getOrNull() } ?: return null

        return AppleAdsDailyMetrics(
            date = date,
            impressions = row.impressions ?: 0,
            taps = row.taps ?: 0,
            totalInstalls = row.totalInstalls ?: 0,
            tapInstalls = row.tapInstalls ?: 0,
            viewInstalls = row.viewInstalls ?: 0,
            totalNewDownloads = row.totalNewDownloads ?: 0,
            totalRedownloads = row.totalRedownloads ?: 0,
            spend = row.localSpend?.amount?.toBigDecimalOrNull() ?: BigDecimal.ZERO,
            currency = row.localSpend?.currency,
        )
    }

    private fun orgHeaders(): HttpHeaders {
        if (properties.orgId.isBlank()) {
            throw BusinessException(ErrorCode.APPLE_ADS_NOT_CONFIGURED)
        }

        return HttpHeaders().apply {
            setBearerAuth(tokenProvider.accessToken())
            set(ORG_HEADER, "$ORG_HEADER_PREFIX${properties.orgId}")
        }
    }

    private fun <T> call(failureMessage: String, request: () -> T?): T = runCatching(request)
        .onFailure { log.error(it) { failureMessage } }
        .getOrNull()
        ?: throw BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)

    private data class AclResponse(val data: List<Acl>?)

    private data class Acl(
        val orgId: Long,
        val orgName: String?,
        val currency: String?,
        val timeZone: String?,
        val roleNames: List<String>?,
    )

    private data class CampaignListResponse(val data: List<Campaign>?)

    private data class Campaign(
        val id: Long,
        val name: String?,
        val status: String?,
        val deleted: Boolean?,
    )

    private data class ReportRequest(
        val startTime: String,
        val endTime: String,
        val selector: ReportSelector,
        val granularity: String = GRANULARITY_DAILY,
        val timeZone: String = TIME_ZONE_ORG,
        val returnRowTotals: Boolean = false,
        val returnGrandTotals: Boolean = false,
        val returnRecordsWithNoMetrics: Boolean = false,
    )

    private data class ReportSelector(
        val pagination: ReportPagination,
        val orderBy: List<ReportOrder> = listOf(ReportOrder()),
    )

    private data class ReportPagination(val offset: Int, val limit: Int)

    private data class ReportOrder(val field: String = ORDER_FIELD, val sortOrder: String = ORDER_DESCENDING)

    private data class ReportResponse(val data: ReportData?)

    private data class ReportData(val reportingDataResponse: ReportingData?)

    private data class ReportingData(val row: List<ReportRow>?)

    private data class ReportRow(
        val other: Boolean?,
        val metadata: ReportMetadata?,
        val granularity: List<ReportMetrics>?,
    )

    private data class ReportMetadata(
        val keywordId: Long?,
        val keyword: String?,
        val keywordStatus: String?,
        val matchType: String?,
        val bidAmount: Money?,
        val adGroupId: Long?,
        val adGroupName: String?,
        val searchTermText: String?,
        val searchTermSource: String?,
        val countryOrRegion: String?,
    )

    private data class ReportMetrics(
        val date: String?,
        val impressions: Long?,
        val taps: Long?,
        val totalInstalls: Long?,
        val tapInstalls: Long?,
        val viewInstalls: Long?,
        val totalNewDownloads: Long?,
        val totalRedownloads: Long?,
        val localSpend: Money?,
    )

    private data class Money(val amount: String?, val currency: String?)

    companion object {

        const val PAGE_SIZE = 1000

        private const val ACLS_PATH = "/acls"
        private const val CAMPAIGNS_PATH = "/campaigns"
        private const val REPORTS_PATH = "/reports/campaigns"
        private const val ORG_HEADER = "X-AP-Context"
        private const val ORG_HEADER_PREFIX = "orgId="
        private const val GRANULARITY_DAILY = "DAILY"
        private const val TIME_ZONE_ORG = "ORTZ"
        private const val ORDER_FIELD = "impressions"
        private const val ORDER_DESCENDING = "DESCENDING"

        private val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(2)
        private val READ_TIMEOUT: Duration = Duration.ofSeconds(30)
    }
}
