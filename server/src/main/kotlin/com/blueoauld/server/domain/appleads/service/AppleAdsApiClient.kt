package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsAdAccount
import com.blueoauld.server.domain.appleads.dto.AppleAdsCampaignInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsDailyMetrics
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordDailyRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsNegativeKeywordInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermDailyRow
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.AppleAdsProperties
import com.fasterxml.jackson.annotation.JsonInclude
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.http.HttpHeaders
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import java.math.BigDecimal
import java.math.RoundingMode
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

    override fun findAdAccounts(): List<AppleAdsAdAccount> {
        val token = tokenProvider.accessToken()

        val response = call("애플 광고 광고 계정 목록을 불러오지 못했다.") {
            restClient.get()
                .uri(ACLS_PATH)
                .headers { it.setBearerAuth(token) }
                .retrieve()
                .body<AclResponse>()
        }

        return response.result?.acls.orEmpty().mapNotNull { acl ->
            val adAccount = acl.adAccount ?: return@mapNotNull null
            val detail = findAdAccount(adAccount.id)

            AppleAdsAdAccount(
                adAccountId = adAccount.id,
                name = adAccount.name ?: detail.name.orEmpty(),
                orgId = adAccount.orgId,
                currency = detail.currency,
                timeZone = detail.timezone,
                roleNames = acl.roles.orEmpty(),
            )
        }
    }

    override fun findCampaigns(): List<AppleAdsCampaignInfo> {
        val headers = accountHeaders()

        val response = call("애플 광고 캠페인 목록을 불러오지 못했다.") {
            restClient.post()
                .uri(CAMPAIGNS_QUERY_PATH)
                .headers { it.addAll(headers) }
                .body(QueryRequest(pagination = QueryPagination(offset = 0, pageSize = PAGE_SIZE)))
                .retrieve()
                .body<CampaignQueryResponse>()
        }

        return response.result.orEmpty().map {
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
        reportRows(KEYWORD_REPORT_PATH, campaignId, startDate, endDate, groupBy = null).flatMap { row ->
            val metadata = row.metadata ?: return@flatMap emptyList()
            val keywordId = metadata.id ?: return@flatMap emptyList()
            val adGroupId = metadata.adGroupId ?: return@flatMap emptyList()

            dailyEntries(row, startDate, endDate).map {
                AppleAdsKeywordDailyRow(
                    keywordId = keywordId,
                    keyword = metadata.text.orEmpty(),
                    matchType = metadata.matchType,
                    keywordStatus = domainStatus(metadata.status),
                    deleted = metadata.deleted ?: false,
                    bidAmount = metadata.bid?.amount?.toBigDecimalOrNull(),
                    suggestedBidAmount = row.insights?.bidRecommendation?.suggestedBidAmount,
                    bidMin = null,
                    bidMax = null,
                    adGroupId = adGroupId,
                    adGroupName = metadata.adGroup?.name,
                    metrics = it.metrics,
                )
            }
        }

    override fun findSearchTermDailyRows(
        campaignId: Long,
        startDate: LocalDate,
        endDate: LocalDate,
    ): List<AppleAdsSearchTermDailyRow> =
        reportRows(SEARCH_TERM_REPORT_PATH, campaignId, startDate, endDate, groupBy = SEARCH_TERM_GROUP_BY)
            .flatMap { row ->
                val metadata = row.metadata ?: return@flatMap emptyList()
                val searchTerm = metadata.searchTermText ?: return@flatMap emptyList()
                val adGroupId = metadata.adGroupId ?: return@flatMap emptyList()
                val keyword = metadata.keyword?.takeIf { it.id != null }

                dailyEntries(row, startDate, endDate).map {
                    AppleAdsSearchTermDailyRow(
                        searchTerm = searchTerm,
                        searchTermSource = if (keyword == null) SOURCE_SEARCH_MATCH else SOURCE_KEYWORD,
                        countryOrRegion = metadata.countryOrRegion ?: it.countryOrRegion,
                        keywordId = keyword?.id,
                        keyword = keyword?.text,
                        matchType = keyword?.matchType,
                        adGroupId = adGroupId,
                        adGroupName = metadata.adGroup?.name,
                        metrics = it.metrics,
                    )
                }
            }

    override fun findKeyword(keywordId: Long): AppleAdsKeywordInfo {
        val headers = accountHeaders()

        val response = call("애플 광고 키워드를 불러오지 못했다. keywordId=$keywordId") {
            restClient.get()
                .uri("$KEYWORDS_PATH/$keywordId")
                .headers { it.addAll(headers) }
                .retrieve()
                .body<KeywordResponse>()
        }

        return response.result?.let(::toKeywordInfo) ?: throw BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)
    }

    override fun updateKeyword(
        keywordId: Long,
        status: String?,
        bid: BigDecimal?,
        currency: String?,
    ): AppleAdsKeywordInfo {
        val headers = accountHeaders()
        val body = KeywordUpdateRequest(status = status?.let(::apiStatus), bid = money(bid, currency))

        val response = call("애플 광고 키워드를 수정하지 못했다. keywordId=$keywordId") {
            restClient.put()
                .uri("$KEYWORDS_PATH/$keywordId")
                .headers { it.addAll(headers) }
                .body(body)
                .retrieve()
                .body<KeywordResponse>()
        }

        return response.result?.let(::toKeywordInfo) ?: throw BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)
    }

    override fun createKeyword(
        adGroupId: Long,
        text: String,
        matchType: String,
        bid: BigDecimal,
        currency: String,
    ): AppleAdsKeywordInfo {
        val headers = accountHeaders()
        val body = KeywordCreateRequest(
            adGroupId = adGroupId,
            text = text,
            matchType = matchType,
            bid = money(bid, currency),
        )

        val response = call("애플 광고 키워드를 만들지 못했다. text=$text") {
            restClient.post()
                .uri(KEYWORDS_PATH)
                .headers { it.addAll(headers) }
                .body(body)
                .retrieve()
                .body<KeywordResponse>()
        }

        return response.result?.let(::toKeywordInfo) ?: throw BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)
    }

    override fun deleteKeyword(keywordId: Long) {
        val headers = accountHeaders()

        call("애플 광고 키워드를 지우지 못했다. keywordId=$keywordId") {
            restClient.delete()
                .uri("$KEYWORDS_PATH/$keywordId")
                .headers { it.addAll(headers) }
                .retrieve()
                .toBodilessEntity()
        }
    }

    override fun createNegativeKeyword(
        adGroupId: Long,
        text: String,
        matchType: String,
    ): AppleAdsNegativeKeywordInfo {
        val headers = accountHeaders()
        val body = NegativeKeywordCreateRequest(adGroupId = adGroupId, text = text, matchType = matchType)

        val response = call("애플 광고 제외 키워드를 만들지 못했다. text=$text") {
            restClient.post()
                .uri(NEGATIVE_KEYWORDS_PATH)
                .headers { it.addAll(headers) }
                .body(body)
                .retrieve()
                .body<NegativeKeywordResponse>()
        }

        val created = response.result ?: throw BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)

        return AppleAdsNegativeKeywordInfo(
            id = created.id,
            adGroupId = created.adGroupId ?: adGroupId,
            text = created.text.orEmpty(),
            matchType = created.matchType,
            status = domainStatus(created.status),
        )
    }

    override fun deleteNegativeKeyword(negativeKeywordId: Long) {
        val headers = accountHeaders()

        call("애플 광고 제외 키워드를 지우지 못했다. negativeKeywordId=$negativeKeywordId") {
            restClient.delete()
                .uri("$NEGATIVE_KEYWORDS_PATH/$negativeKeywordId")
                .headers { it.addAll(headers) }
                .retrieve()
                .toBodilessEntity()
        }
    }

    private fun findAdAccount(adAccountId: Long): AdAccount {
        val headers = contextHeaders(adAccountId.toString())

        val response = call("애플 광고 광고 계정을 불러오지 못했다. adAccountId=$adAccountId") {
            restClient.get()
                .uri("$AD_ACCOUNTS_PATH/$adAccountId")
                .headers { it.addAll(headers) }
                .retrieve()
                .body<AdAccountResponse>()
        }

        return response.result ?: throw BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)
    }

    private fun toKeywordInfo(keyword: Keyword) = AppleAdsKeywordInfo(
        id = keyword.id,
        adGroupId = keyword.adGroupId ?: 0,
        text = keyword.text.orEmpty(),
        matchType = keyword.matchType,
        status = domainStatus(keyword.status),
        bidAmount = keyword.bid?.amount?.toBigDecimalOrNull(),
        currency = keyword.bid?.currency,
        deleted = keyword.deleted ?: false,
    )

    private fun money(amount: BigDecimal?, currency: String?): Money? {
        if (amount == null || currency == null) {
            return null
        }

        return Money(amount = amount.setScale(MONEY_SCALE, RoundingMode.HALF_UP).toPlainString(), currency = currency)
    }

    private fun domainStatus(status: String?) = if (status == API_ENABLED) DOMAIN_ACTIVE else status

    private fun apiStatus(status: String) = if (status == DOMAIN_ACTIVE) API_ENABLED else status

    private fun reportRows(
        path: String,
        campaignId: Long,
        startDate: LocalDate,
        endDate: LocalDate,
        groupBy: List<String>?,
    ): List<ReportRow> {
        val headers = accountHeaders()
        val rows = mutableListOf<ReportRow>()
        var offset = 0

        while (true) {
            val request = ReportRequest(
                filters = listOf(ReportFilter(field = CAMPAIGN_ID_FIELD, value = listOf(campaignId.toString()))),
                timeRange = TimeRange(
                    start = startDate.toString(),
                    end = endDate.toString(),
                    granularity = GRANULARITY_DAILY.takeIf { startDate != endDate },
                ),
                pagination = ReportPagination(offset = offset, pageSize = PAGE_SIZE),
                groupBy = groupBy,
            )

            val response = call("애플 광고 리포트를 불러오지 못했다. path=$path campaignId=$campaignId") {
                restClient.post()
                    .uri(path)
                    .headers { it.addAll(headers) }
                    .body(request)
                    .retrieve()
                    .body<ReportResponse>()
            }

            val page = response.result?.rows.orEmpty()
            rows += page

            if (page.size < PAGE_SIZE) {
                return rows
            }

            offset += PAGE_SIZE
        }
    }

    private fun dailyEntries(row: ReportRow, startDate: LocalDate, endDate: LocalDate): List<DailyEntry> {
        if (startDate == endDate) {
            return listOfNotNull(row.totalMetrics?.let { toDailyEntry(it, startDate) })
        }

        return row.granularMetrics.orEmpty().mapNotNull { metrics ->
            metrics.date
                ?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
                ?.let { toDailyEntry(metrics, it) }
        }
    }

    private fun toDailyEntry(row: ReportMetrics, date: LocalDate) = DailyEntry(
        metrics = AppleAdsDailyMetrics(
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
        ),
        countryOrRegion = row.countryOrRegion,
    )

    private fun accountHeaders(): HttpHeaders {
        if (properties.adAccountId.isBlank()) {
            throw BusinessException(ErrorCode.APPLE_ADS_NOT_CONFIGURED)
        }

        return contextHeaders(properties.adAccountId)
    }

    private fun contextHeaders(adAccountId: String) = HttpHeaders().apply {
        setBearerAuth(tokenProvider.accessToken())
        set(CONTEXT_HEADER, "$AD_ACCOUNT_CONTEXT_PREFIX$adAccountId")
    }

    private fun <T> call(failureMessage: String, request: () -> T?): T = runCatching(request)
        .onFailure { log.error(it) { failureMessage } }
        .getOrNull()
        ?: throw BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)

    private data class DailyEntry(val metrics: AppleAdsDailyMetrics, val countryOrRegion: String?)

    private data class AclResponse(val result: AclResult?)

    private data class AclResult(val acls: List<Acl>?)

    private data class Acl(val adAccount: AclAdAccount?, val roles: List<String>?)

    private data class AclAdAccount(val id: Long, val name: String?, val orgId: Long?)

    private data class AdAccountResponse(val result: AdAccount?)

    private data class AdAccount(val id: Long, val name: String?, val currency: String?, val timezone: String?)

    private data class QueryRequest(val pagination: QueryPagination)

    private data class QueryPagination(val offset: Int, val pageSize: Int)

    private data class CampaignQueryResponse(val result: List<Campaign>?)

    private data class Campaign(
        val id: Long,
        val name: String?,
        val status: String?,
        val deleted: Boolean?,
    )

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private data class ReportRequest(
        val filters: List<ReportFilter>,
        val timeRange: TimeRange,
        val pagination: ReportPagination,
        val groupBy: List<String>?,
    )

    private data class ReportFilter(val field: String, val operator: String = OPERATOR_EQUALS, val value: List<String>)

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private data class TimeRange(
        val start: String,
        val end: String,
        val timeZone: String = TIME_ZONE_ORG,
        val granularity: String?,
    )

    private data class ReportPagination(val offset: Int, val pageSize: Int)

    private data class ReportResponse(val result: ReportResult?)

    private data class ReportResult(val rows: List<ReportRow>?)

    private data class ReportRow(
        val metadata: ReportMetadata?,
        val totalMetrics: ReportMetrics?,
        val granularMetrics: List<ReportMetrics>?,
        val insights: ReportInsights?,
    )

    private data class ReportInsights(val bidRecommendation: BidRecommendation?)

    private data class BidRecommendation(val suggestedBidAmount: BigDecimal?)

    private data class ReportMetadata(
        val id: Long?,
        val text: String?,
        val matchType: String?,
        val status: String?,
        val deleted: Boolean?,
        val bid: Money?,
        val adGroupId: Long?,
        val adGroup: ReportAdGroup?,
        val searchTermText: String?,
        val keyword: ReportKeyword?,
        val countryOrRegion: String?,
    )

    private data class ReportAdGroup(val name: String?)

    private data class ReportKeyword(val id: Long?, val text: String?, val matchType: String?)

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
        val countryOrRegion: String?,
    )

    private data class Money(val amount: String?, val currency: String?)

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private data class KeywordUpdateRequest(val status: String?, val bid: Money?)

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private data class KeywordCreateRequest(
        val adGroupId: Long,
        val text: String,
        val matchType: String,
        val bid: Money?,
        val status: String = API_ENABLED,
    )

    private data class NegativeKeywordCreateRequest(
        val adGroupId: Long,
        val text: String,
        val matchType: String,
        val status: String = API_ENABLED,
    )

    private data class KeywordResponse(val result: Keyword?)

    private data class Keyword(
        val id: Long,
        val adGroupId: Long?,
        val text: String?,
        val status: String?,
        val matchType: String?,
        val bid: Money?,
        val deleted: Boolean?,
    )

    private data class NegativeKeywordResponse(val result: NegativeKeyword?)

    private data class NegativeKeyword(
        val id: Long,
        val adGroupId: Long?,
        val text: String?,
        val status: String?,
        val matchType: String?,
    )

    companion object {

        const val PAGE_SIZE = 1000

        private const val ACLS_PATH = "/acls"
        private const val AD_ACCOUNTS_PATH = "/ad-accounts"
        private const val CAMPAIGNS_QUERY_PATH = "/campaigns/query"
        private const val KEYWORD_REPORT_PATH = "/reports/apps/keywords/query"
        private const val SEARCH_TERM_REPORT_PATH = "/reports/apps/searchterms/query"
        private const val KEYWORDS_PATH = "/keywords"
        private const val NEGATIVE_KEYWORDS_PATH = "/negative-keywords"
        private const val CONTEXT_HEADER = "X-AP-Context"
        private const val AD_ACCOUNT_CONTEXT_PREFIX = "adAccountId="
        private const val CAMPAIGN_ID_FIELD = "campaignId"
        private const val OPERATOR_EQUALS = "EQUALS"
        private const val GRANULARITY_DAILY = "DAILY"
        private const val TIME_ZONE_ORG = "ORTZ"
        private const val API_ENABLED = "ENABLED"
        private const val DOMAIN_ACTIVE = "ACTIVE"
        private const val SOURCE_SEARCH_MATCH = "AUTO"
        private const val SOURCE_KEYWORD = "TARGETED"
        private const val MONEY_SCALE = 2

        private val SEARCH_TERM_GROUP_BY = listOf("countryOrRegion")
        private val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(2)
        private val READ_TIMEOUT: Duration = Duration.ofSeconds(30)
    }
}
