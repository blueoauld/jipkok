package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.AppleAdsProperties
import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpServer
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.math.BigDecimal
import java.net.InetSocketAddress
import java.time.LocalDate

class AppleAdsApiClientTest {

    private lateinit var server: HttpServer

    private val objectMapper = ObjectMapper()

    private val authorizations = mutableListOf<String?>()

    private val contexts = mutableListOf<String?>()

    private val requestBodies = mutableListOf<JsonNode>()

    private val requests = mutableListOf<Pair<String, String>>()

    private var responseStatus = 200

    private var keywordPages = listOf(KEYWORD_ROW)

    private var keywordReportBody: String? = null

    @BeforeEach
    fun setUp() {
        server = HttpServer.create(InetSocketAddress(0), 0)
        server.createContext("/acls") { record(it, ACLS_BODY) }
        server.createContext("/ad-accounts") { record(it, AD_ACCOUNT_BODY) }
        server.createContext("/campaigns/query") { record(it, CAMPAIGNS_BODY) }
        server.createContext("/reports/apps/keywords/query") { exchange ->
            val body = objectMapper.readTree(exchange.requestBody.readAllBytes())
            requestBodies.add(body)
            val pageIndex = body["pagination"]["offset"].asInt() / AppleAdsApiClient.PAGE_SIZE
            val page = keywordPages.getOrElse(pageIndex) { "" }
            respond(exchange, keywordReportBody ?: """{"result":{"rows":[$page]}}""")
        }
        server.createContext("/reports/apps/searchterms/query") { exchange ->
            requestBodies.add(objectMapper.readTree(exchange.requestBody.readAllBytes()))
            respond(exchange, """{"result":{"rows":[$SEARCH_TERM_ROWS]}}""")
        }
        server.createContext("/keywords") { exchange ->
            val body = if (exchange.requestMethod == "DELETE") "" else KEYWORD_BODY
            record(exchange, body)
        }
        server.createContext("/negative-keywords") { exchange ->
            val body = if (exchange.requestMethod == "DELETE") "" else NEGATIVE_KEYWORD_BODY
            record(exchange, body)
        }
        server.start()
    }

    @AfterEach
    fun tearDown() {
        server.stop(0)
    }

    @Test
    fun `토큰을 붙여 광고 계정 목록을 가져오고 계정마다 통화와 시간대를 채운다`() {
        // given
        val client = client()

        // when
        val adAccounts = client.findAdAccounts()

        // then
        assertThat(requests).containsExactly("GET" to "/acls", "GET" to "/ad-accounts/$AD_ACCOUNT_ID")
        assertThat(authorizations).containsOnly("Bearer $TOKEN")
        assertThat(contexts).containsExactly(null, "adAccountId=$AD_ACCOUNT_ID")
        assertThat(adAccounts).hasSize(1)
        assertThat(adAccounts[0].adAccountId).isEqualTo(AD_ACCOUNT_ID.toLong())
        assertThat(adAccounts[0].name).isEqualTo("Jipkok")
        assertThat(adAccounts[0].orgId).isEqualTo(22327140L)
        assertThat(adAccounts[0].currency).isEqualTo("USD")
        assertThat(adAccounts[0].timeZone).isEqualTo("Asia/Seoul")
        assertThat(adAccounts[0].roleNames).containsExactly("API Campaign Manager")
    }

    @Test
    fun `애플이 응답하지 않으면 실패한다`() {
        // given
        responseStatus = 500
        val client = client()

        // when
        val exception = assertThrows(BusinessException::class.java) { client.findAdAccounts() }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.APPLE_ADS_UNAVAILABLE)
    }

    @Test
    fun `광고 계정 헤더를 붙여 캠페인 목록을 조회한다`() {
        // given
        val client = client()

        // when
        val campaigns = client.findCampaigns()

        // then
        assertThat(requests.single()).isEqualTo("POST" to "/campaigns/query")
        assertThat(contexts.single()).isEqualTo("adAccountId=$AD_ACCOUNT_ID")
        assertThat(requestBodies.single()["pagination"]["pageSize"].asInt()).isEqualTo(AppleAdsApiClient.PAGE_SIZE)
        assertThat(campaigns).hasSize(1)
        assertThat(campaigns[0].id).isEqualTo(CAMPAIGN_ID)
        assertThat(campaigns[0].name).isEqualTo("Jipkok KR")
        assertThat(campaigns[0].status).isEqualTo("ENABLED")
        assertThat(campaigns[0].deleted).isFalse()
    }

    @Test
    fun `광고 계정 ID가 없으면 캠페인을 조회하지 않는다`() {
        // given
        val client = client(adAccountId = "")

        // when
        val exception = assertThrows(BusinessException::class.java) { client.findCampaigns() }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.APPLE_ADS_NOT_CONFIGURED)
        assertThat(requests).isEmpty()
    }

    @Test
    fun `키워드 리포트를 캠페인으로 걸러 일 단위로 요청하고 날짜별 행으로 편다`() {
        // given
        val client = client()

        // when
        val rows = client.findKeywordDailyRows(CAMPAIGN_ID, START, END)

        // then
        val body = requestBodies.single()
        assertThat(body["filters"][0]["field"].asText()).isEqualTo("campaignId")
        assertThat(body["filters"][0]["operator"].asText()).isEqualTo("EQUALS")
        assertThat(body["filters"][0]["value"][0].asText()).isEqualTo(CAMPAIGN_ID.toString())
        assertThat(body["timeRange"]["start"].asText()).isEqualTo("2026-09-01")
        assertThat(body["timeRange"]["end"].asText()).isEqualTo("2026-09-02")
        assertThat(body["timeRange"]["timeZone"].asText()).isEqualTo("ORTZ")
        assertThat(body["timeRange"]["granularity"].asText()).isEqualTo("DAILY")
        assertThat(body["pagination"]["offset"].asInt()).isZero()
        assertThat(body["pagination"]["pageSize"].asInt()).isEqualTo(AppleAdsApiClient.PAGE_SIZE)
        assertThat(body.has("groupBy")).isFalse()

        assertThat(rows).hasSize(2)
        assertThat(rows[0].keywordId).isEqualTo(KEYWORD_ID)
        assertThat(rows[0].keyword).isEqualTo("dating app")
        assertThat(rows[0].matchType).isEqualTo("EXACT")
        assertThat(rows[0].keywordStatus).isEqualTo("ACTIVE")
        assertThat(rows[0].deleted).isFalse()
        assertThat(rows[0].bidAmount).isEqualByComparingTo(BigDecimal("1.50"))
        assertThat(rows[0].suggestedBidAmount).isEqualByComparingTo(BigDecimal("2.40"))
        assertThat(rows[0].bidMin).isNull()
        assertThat(rows[0].bidMax).isNull()
        assertThat(rows[0].adGroupId).isEqualTo(AD_GROUP_ID)
        assertThat(rows[0].adGroupName).isEqualTo("Ad Group 1")
        assertThat(rows[0].metrics.date).isEqualTo(START)
        assertThat(rows[0].metrics.impressions).isEqualTo(76)
        assertThat(rows[0].metrics.taps).isEqualTo(45)
        assertThat(rows[0].metrics.totalInstalls).isEqualTo(16)
        assertThat(rows[0].metrics.tapInstalls).isEqualTo(10)
        assertThat(rows[0].metrics.viewInstalls).isEqualTo(6)
        assertThat(rows[0].metrics.totalNewDownloads).isEqualTo(12)
        assertThat(rows[0].metrics.totalRedownloads).isEqualTo(4)
        assertThat(rows[0].metrics.spend).isEqualByComparingTo(BigDecimal("12.34"))
        assertThat(rows[0].metrics.currency).isEqualTo("USD")
        assertThat(rows[1].metrics.date).isEqualTo(END)
        assertThat(rows[1].metrics.spend).isEqualByComparingTo(BigDecimal.ZERO)
        assertThat(rows[1].metrics.currency).isEqualTo("USD")
    }

    @Test
    fun `하루만 요청하면 단위 없이 받아 기간 합계를 그날 행으로 쓴다`() {
        // given
        val client = client()

        // when
        val rows = client.findKeywordDailyRows(CAMPAIGN_ID, START, START)

        // then
        assertThat(requestBodies.single()["timeRange"].has("granularity")).isFalse()
        assertThat(rows).hasSize(1)
        assertThat(rows[0].metrics.date).isEqualTo(START)
        assertThat(rows[0].metrics.impressions).isEqualTo(79)
        assertThat(rows[0].metrics.spend).isEqualByComparingTo(BigDecimal("12.34"))
    }

    @Test
    fun `리포트에 행이 없으면 빈 목록을 돌려준다`() {
        // given
        keywordReportBody = """{"result":{},"pagination":{"offset":0,"pageSize":1000,"totalCount":0}}"""
        val client = client()

        // when
        val rows = client.findKeywordDailyRows(CAMPAIGN_ID, START, END)

        // then
        assertThat(rows).isEmpty()
    }

    @Test
    fun `페이지가 가득 차면 다음 페이지를 이어서 받는다`() {
        // given
        val fullPage = List(AppleAdsApiClient.PAGE_SIZE) { KEYWORD_ROW }.joinToString(",")
        keywordPages = listOf(fullPage, KEYWORD_ROW)
        val client = client()

        // when
        val rows = client.findKeywordDailyRows(CAMPAIGN_ID, START, END)

        // then
        assertThat(requestBodies).hasSize(2)
        assertThat(requestBodies[1]["pagination"]["offset"].asInt()).isEqualTo(AppleAdsApiClient.PAGE_SIZE)
        assertThat(rows).hasSize(AppleAdsApiClient.PAGE_SIZE * 2 + 2)
    }

    @Test
    fun `검색어 리포트는 나라별로 받고 키워드가 없는 행을 Search Match로 본다`() {
        // given
        val client = client()

        // when
        val rows = client.findSearchTermDailyRows(CAMPAIGN_ID, START, END)

        // then
        assertThat(requestBodies.single()["groupBy"][0].asText()).isEqualTo("countryOrRegion")
        assertThat(rows).hasSize(2)
        assertThat(rows[0].searchTerm).isEqualTo("소개팅 앱")
        assertThat(rows[0].searchTermSource).isEqualTo("AUTO")
        assertThat(rows[0].countryOrRegion).isEqualTo("KR")
        assertThat(rows[0].keywordId).isNull()
        assertThat(rows[0].keyword).isNull()
        assertThat(rows[0].adGroupId).isEqualTo(AD_GROUP_ID)
        assertThat(rows[0].adGroupName).isEqualTo("Ad Group 1")
        assertThat(rows[0].metrics.date).isEqualTo(START)
        assertThat(rows[0].metrics.impressions).isEqualTo(30)
        assertThat(rows[1].searchTerm).isEqualTo("dating app")
        assertThat(rows[1].searchTermSource).isEqualTo("TARGETED")
        assertThat(rows[1].countryOrRegion).isEqualTo("KR")
        assertThat(rows[1].keywordId).isEqualTo(KEYWORD_ID)
        assertThat(rows[1].keyword).isEqualTo("dating app")
        assertThat(rows[1].matchType).isEqualTo("EXACT")
        assertThat(rows[1].metrics.currency).isEqualTo("USD")
    }

    @Test
    fun `키워드 하나를 조회해 현재 상태와 입찰가를 받는다`() {
        // given
        val client = client()

        // when
        val keyword = client.findKeyword(KEYWORD_ID)

        // then
        assertThat(requests.single()).isEqualTo("GET" to "/keywords/$KEYWORD_ID")
        assertThat(contexts.single()).isEqualTo("adAccountId=$AD_ACCOUNT_ID")
        assertThat(keyword.id).isEqualTo(KEYWORD_ID)
        assertThat(keyword.status).isEqualTo("ACTIVE")
        assertThat(keyword.bidAmount).isEqualByComparingTo(BigDecimal("1.23"))
        assertThat(keyword.deleted).isFalse()
    }

    @Test
    fun `키워드 입찰가 수정은 입찰가만 문자열 금액으로 보낸다`() {
        // given
        val client = client()

        // when
        val updated = client.updateKeyword(KEYWORD_ID, null, BigDecimal("1.234"), "USD")

        // then
        assertThat(requests.single()).isEqualTo("PUT" to "/keywords/$KEYWORD_ID")
        assertThat(contexts.single()).isEqualTo("adAccountId=$AD_ACCOUNT_ID")
        val body = requestBodies.single()
        assertThat(body.has("status")).isFalse()
        assertThat(body["bid"]["amount"].asText()).isEqualTo("1.23")
        assertThat(body["bid"]["currency"].asText()).isEqualTo("USD")
        assertThat(updated.id).isEqualTo(KEYWORD_ID)
        assertThat(updated.adGroupId).isEqualTo(AD_GROUP_ID)
        assertThat(updated.status).isEqualTo("ACTIVE")
        assertThat(updated.bidAmount).isEqualByComparingTo(BigDecimal("1.23"))
        assertThat(updated.currency).isEqualTo("USD")
    }

    @Test
    fun `키워드 상태는 활성을 애플의 ENABLED로 바꿔 보낸다`() {
        // given
        val client = client()

        // when
        client.updateKeyword(KEYWORD_ID, "PAUSED", null, null)
        client.updateKeyword(KEYWORD_ID, "ACTIVE", null, null)

        // then
        assertThat(requestBodies[0]["status"].asText()).isEqualTo("PAUSED")
        assertThat(requestBodies[0].has("bid")).isFalse()
        assertThat(requestBodies[1]["status"].asText()).isEqualTo("ENABLED")
    }

    @Test
    fun `키워드를 만들고 지운다`() {
        // given
        val client = client()

        // when
        val created = client.createKeyword(AD_GROUP_ID, "소개팅 앱", "EXACT", BigDecimal("1.45"), "USD")
        client.deleteKeyword(created.id)

        // then
        assertThat(requests).containsExactly("POST" to "/keywords", "DELETE" to "/keywords/$KEYWORD_ID")
        val body = requestBodies.single()
        assertThat(body["adGroupId"].asLong()).isEqualTo(AD_GROUP_ID)
        assertThat(body["text"].asText()).isEqualTo("소개팅 앱")
        assertThat(body["matchType"].asText()).isEqualTo("EXACT")
        assertThat(body["bid"]["amount"].asText()).isEqualTo("1.45")
        assertThat(body["status"].asText()).isEqualTo("ENABLED")
        assertThat(created.id).isEqualTo(KEYWORD_ID)
    }

    @Test
    fun `제외 키워드를 광고그룹에 만들고 지운다`() {
        // given
        val client = client()

        // when
        val created = client.createNegativeKeyword(AD_GROUP_ID, "디스코드", "EXACT")
        client.deleteNegativeKeyword(created.id)

        // then
        assertThat(requests).containsExactly(
            "POST" to "/negative-keywords",
            "DELETE" to "/negative-keywords/$NEGATIVE_KEYWORD_ID",
        )
        val body = requestBodies.single()
        assertThat(body["adGroupId"].asLong()).isEqualTo(AD_GROUP_ID)
        assertThat(body.has("campaignId")).isFalse()
        assertThat(body["text"].asText()).isEqualTo("디스코드")
        assertThat(body["matchType"].asText()).isEqualTo("EXACT")
        assertThat(created.id).isEqualTo(NEGATIVE_KEYWORD_ID)
        assertThat(created.adGroupId).isEqualTo(AD_GROUP_ID)
        assertThat(created.matchType).isEqualTo("EXACT")
        assertThat(created.status).isEqualTo("ACTIVE")
    }

    private fun client(adAccountId: String = AD_ACCOUNT_ID): AppleAdsApiClient {
        val tokenProvider = mockk<AppleAdsTokenProvider>()
        every { tokenProvider.accessToken() } returns TOKEN

        return AppleAdsApiClient(
            AppleAdsProperties(adAccountId = adAccountId, apiUrl = "http://localhost:${server.address.port}"),
            tokenProvider,
        )
    }

    private fun record(exchange: HttpExchange, body: String) {
        requests.add(exchange.requestMethod to exchange.requestURI.path)
        val requestBody = exchange.requestBody.readAllBytes()
        if (requestBody.isNotEmpty()) {
            requestBodies.add(objectMapper.readTree(requestBody))
        }
        respond(exchange, body)
    }

    private fun respond(exchange: HttpExchange, body: String) {
        authorizations.add(exchange.requestHeaders.getFirst("Authorization"))
        contexts.add(exchange.requestHeaders.getFirst("X-AP-Context"))
        val bytes = body.toByteArray()
        exchange.responseHeaders.add("Content-Type", "application/json")
        exchange.sendResponseHeaders(responseStatus, if (bytes.isEmpty()) -1 else bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
    }

    companion object {

        private const val TOKEN = "access-token"
        private const val AD_ACCOUNT_ID = "22327141"
        private const val CAMPAIGN_ID = 1000L
        private const val AD_GROUP_ID = 542317095L
        private const val KEYWORD_ID = 87675432L
        private const val NEGATIVE_KEYWORD_ID = 99001L

        private val START: LocalDate = LocalDate.of(2026, 9, 1)
        private val END: LocalDate = LocalDate.of(2026, 9, 2)

        private const val ACLS_BODY = """{"result":{"acls":[{"adAccount":{"id":$AD_ACCOUNT_ID,"name":"Jipkok",""" +
            """"orgId":22327140},"roles":["API Campaign Manager"]}]}}"""

        private const val AD_ACCOUNT_BODY = """{"result":{"id":$AD_ACCOUNT_ID,"name":"Jipkok","orgId":22327140,""" +
            """"timezone":"Asia/Seoul","currency":"USD","paymentModel":"PAYG","systemStatus":"ACTIVE",""" +
            """"productFeatures":["APPSTORE_APP_MANUAL"]}}"""

        private const val CAMPAIGNS_BODY = """{"result":[""" +
            """{"id":$CAMPAIGN_ID,"adAccountId":$AD_ACCOUNT_ID,"name":"Jipkok KR","status":"ENABLED",""" +
            """"displayStatus":"RUNNING","deleted":false}""" +
            """],"pagination":{"offset":0,"pageSize":1000,"totalCount":1}}"""

        private const val KEYWORD_BODY = """{"result":{"id":$KEYWORD_ID,"adAccountId":$AD_ACCOUNT_ID,""" +
            """"campaignId":$CAMPAIGN_ID,"adGroupId":$AD_GROUP_ID,"text":"소개팅 앱","matchType":"EXACT",""" +
            """"bid":{"amount":"1.23","currency":"USD"},"status":"ENABLED","displayStatus":"RUNNING",""" +
            """"deleted":false}}"""

        private const val NEGATIVE_KEYWORD_BODY = """{"result":{"id":$NEGATIVE_KEYWORD_ID,""" +
            """"adAccountId":$AD_ACCOUNT_ID,"campaignId":$CAMPAIGN_ID,"adGroupId":$AD_GROUP_ID,""" +
            """"text":"디스코드","matchType":"EXACT","status":"ENABLED","deleted":false}}"""

        private const val KEYWORD_ROW = """{"metadata":{"id":$KEYWORD_ID,"text":"dating app","matchType":"EXACT",""" +
            """"adAccountId":$AD_ACCOUNT_ID,"campaignId":$CAMPAIGN_ID,"adGroupId":$AD_GROUP_ID,""" +
            """"status":"ENABLED","deleted":false,"bid":{"amount":"1.50","currency":"USD"},""" +
            """"adGroup":{"name":"Ad Group 1","deleted":false}},""" +
            """"totalMetrics":{"impressions":79,"taps":45,"totalInstalls":16,"tapInstalls":10,"viewInstalls":6,""" +
            """"totalNewDownloads":12,"totalRedownloads":4,"localSpend":{"amount":"12.34","currency":"USD"}},""" +
            """"granularMetrics":[""" +
            """{"date":"2026-09-01","impressions":76,"taps":45,"totalInstalls":16,"tapInstalls":10,""" +
            """"viewInstalls":6,"totalNewDownloads":12,"totalRedownloads":4,""" +
            """"localSpend":{"amount":"12.34","currency":"USD"}},""" +
            """{"date":"2026-09-02","impressions":3,"taps":0}],""" +
            """"insights":{"bidRecommendation":{"suggestedBidAmount":2.40}}}"""

        private const val SEARCH_TERM_ROWS = """{"metadata":{"campaignId":$CAMPAIGN_ID,""" +
            """"adAccountId":$AD_ACCOUNT_ID,"searchTermText":"소개팅 앱","searchTermSource":"SEARCH",""" +
            """"adGroupId":$AD_GROUP_ID,"adGroup":{"name":"Ad Group 1","deleted":false},""" +
            """"countryOrRegion":"KR"},""" +
            """"granularMetrics":[{"date":"2026-09-01","impressions":30,"taps":4,"totalInstalls":1,""" +
            """"tapInstalls":1,"localSpend":{"amount":"2.00","currency":"USD"}}]},""" +
            """{"metadata":{"campaignId":$CAMPAIGN_ID,"searchTermText":"dating app","searchTermSource":"SEARCH",""" +
            """"keyword":{"id":$KEYWORD_ID,"text":"dating app","matchType":"EXACT","status":"ENABLED",""" +
            """"bid":{"amount":"1.50","currency":"USD"},"adGroupId":$AD_GROUP_ID},""" +
            """"adGroupId":$AD_GROUP_ID,"adGroup":{"name":"Ad Group 1"}},""" +
            """"granularMetrics":[{"date":"2026-09-01","countryOrRegion":"KR","impressions":12,"taps":0}]},""" +
            """{"metadata":{"campaignId":$CAMPAIGN_ID,"adGroupId":$AD_GROUP_ID},""" +
            """"granularMetrics":[{"date":"2026-09-01","impressions":9,"taps":0}]}"""
    }
}
