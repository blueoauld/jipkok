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

    private val headers = mutableMapOf<String, String?>()

    private val requestBodies = mutableListOf<JsonNode>()

    private val requests = mutableListOf<Pair<String, String>>()

    private var responseStatus = 200

    private var keywordPages = listOf(KEYWORD_ROW)

    @BeforeEach
    fun setUp() {
        server = HttpServer.create(InetSocketAddress(0), 0)
        server.createContext("/acls") { respond(it, ACLS_BODY) }
        server.createContext("/campaigns") { respond(it, CAMPAIGNS_BODY) }
        server.createContext("/reports/campaigns/$CAMPAIGN_ID/keywords") { exchange ->
            val body = objectMapper.readTree(exchange.requestBody.readAllBytes())
            requestBodies.add(body)
            val pageIndex = body["selector"]["pagination"]["offset"].asInt() / AppleAdsApiClient.PAGE_SIZE
            val page = keywordPages.getOrElse(pageIndex) { "" }
            respond(exchange, """{"data":{"reportingDataResponse":{"row":[$page]}}}""")
        }
        server.createContext("$KEYWORDS_PATH/bulk") { record(it, KEYWORD_LIST_BODY) }
        server.createContext("$KEYWORDS_PATH/delete/bulk") { record(it, COUNT_BODY) }
        server.createContext("$NEGATIVE_KEYWORDS_PATH/bulk") { record(it, NEGATIVE_KEYWORD_LIST_BODY) }
        server.createContext("$NEGATIVE_KEYWORDS_PATH/delete/bulk") { record(it, COUNT_BODY) }
        server.createContext("/reports/campaigns/$CAMPAIGN_ID/searchterms") { exchange ->
            requestBodies.add(objectMapper.readTree(exchange.requestBody.readAllBytes()))
            respond(exchange, """{"data":{"reportingDataResponse":{"row":[$SEARCH_TERM_ROWS]}}}""")
        }
        server.start()
    }

    @AfterEach
    fun tearDown() {
        server.stop(0)
    }

    @Test
    fun `토큰을 붙여 조직 목록을 가져온다`() {
        // given
        val client = client()

        // when
        val orgs = client.findOrgs()

        // then
        assertThat(headers["Authorization"]).isEqualTo("Bearer $TOKEN")
        assertThat(orgs).hasSize(1)
        assertThat(orgs[0].orgId).isEqualTo(123456L)
        assertThat(orgs[0].orgName).isEqualTo("Jipkok")
        assertThat(orgs[0].currency).isEqualTo("KRW")
        assertThat(orgs[0].timeZone).isEqualTo("Asia/Seoul")
        assertThat(orgs[0].roleNames).containsExactly("API Account Manager")
    }

    @Test
    fun `애플이 응답하지 않으면 실패한다`() {
        // given
        responseStatus = 500
        val client = client()

        // when
        val exception = assertThrows(BusinessException::class.java) { client.findOrgs() }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.APPLE_ADS_UNAVAILABLE)
    }

    @Test
    fun `조직 헤더를 붙여 캠페인 목록을 가져온다`() {
        // given
        val client = client()

        // when
        val campaigns = client.findCampaigns()

        // then
        assertThat(headers["X-AP-Context"]).isEqualTo("orgId=$ORG_ID")
        assertThat(campaigns).hasSize(2)
        assertThat(campaigns[0].id).isEqualTo(CAMPAIGN_ID)
        assertThat(campaigns[0].name).isEqualTo("Jipkok KR")
        assertThat(campaigns[0].status).isEqualTo("ENABLED")
        assertThat(campaigns[0].deleted).isFalse()
        assertThat(campaigns[1].deleted).isTrue()
    }

    @Test
    fun `조직 ID가 없으면 캠페인을 조회하지 않는다`() {
        // given
        val client = client(orgId = "")

        // when
        val exception = assertThrows(BusinessException::class.java) { client.findCampaigns() }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.APPLE_ADS_NOT_CONFIGURED)
        assertThat(headers).isEmpty()
    }

    @Test
    fun `키워드 리포트를 일 단위로 요청해 날짜별 행으로 편다`() {
        // given
        val client = client()

        // when
        val rows = client.findKeywordDailyRows(CAMPAIGN_ID, START, END)

        // then
        val body = requestBodies.single()
        assertThat(body["startTime"].asText()).isEqualTo("2026-09-01")
        assertThat(body["endTime"].asText()).isEqualTo("2026-09-02")
        assertThat(body["granularity"].asText()).isEqualTo("DAILY")
        assertThat(body["timeZone"].asText()).isEqualTo("ORTZ")
        assertThat(body["returnRowTotals"].asBoolean()).isFalse()
        assertThat(body["returnGrandTotals"].asBoolean()).isFalse()
        assertThat(body["selector"]["pagination"]["limit"].asInt()).isEqualTo(AppleAdsApiClient.PAGE_SIZE)

        assertThat(rows).hasSize(2)
        assertThat(rows[0].keywordId).isEqualTo(87675432L)
        assertThat(rows[0].keyword).isEqualTo("dating app")
        assertThat(rows[0].matchType).isEqualTo("EXACT")
        assertThat(rows[0].keywordStatus).isEqualTo("ACTIVE")
        assertThat(rows[0].bidAmount).isEqualByComparingTo(BigDecimal("1.50"))
        assertThat(rows[0].suggestedBidAmount).isEqualByComparingTo(BigDecimal("2.40"))
        assertThat(rows[0].bidMin).isNull()
        assertThat(rows[0].bidMax).isNull()
        assertThat(rows[0].adGroupId).isEqualTo(542317095L)
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
        assertThat(requestBodies[1]["selector"]["pagination"]["offset"].asInt()).isEqualTo(AppleAdsApiClient.PAGE_SIZE)
        assertThat(rows).hasSize(AppleAdsApiClient.PAGE_SIZE * 2 + 2)
    }

    @Test
    fun `검색어 리포트는 기타로 묶인 행을 뺀다`() {
        // given
        val client = client()

        // when
        val rows = client.findSearchTermDailyRows(CAMPAIGN_ID, START, END)

        // then
        assertThat(rows).hasSize(1)
        assertThat(rows[0].searchTerm).isEqualTo("소개팅 앱")
        assertThat(rows[0].searchTermSource).isEqualTo("AUTO")
        assertThat(rows[0].countryOrRegion).isEqualTo("KR")
        assertThat(rows[0].keywordId).isNull()
        assertThat(rows[0].adGroupId).isEqualTo(542317095L)
        assertThat(rows[0].metrics.date).isEqualTo(START)
        assertThat(rows[0].metrics.impressions).isEqualTo(30)
    }

    @Test
    fun `키워드 수정은 ID를 문자열로, 입찰가를 문자열 금액으로 보낸다`() {
        // given
        val client = client()

        // when
        val updated = client.updateKeyword(CAMPAIGN_ID, AD_GROUP_ID, KEYWORD_ID, null, BigDecimal("1.234"), "USD")

        // then
        assertThat(requests.single()).isEqualTo(
            "PUT" to "/campaigns/$CAMPAIGN_ID/adgroups/$AD_GROUP_ID/targetingkeywords/bulk",
        )
        val body = requestBodies.single()
        assertThat(body.isArray).isTrue()
        assertThat(body[0]["id"].asText()).isEqualTo(KEYWORD_ID.toString())
        assertThat(body[0].has("status")).isFalse()
        assertThat(body[0]["bidAmount"]["amount"].asText()).isEqualTo("1.23")
        assertThat(body[0]["bidAmount"]["currency"].asText()).isEqualTo("USD")
        assertThat(updated.id).isEqualTo(KEYWORD_ID)
        assertThat(updated.status).isEqualTo("PAUSED")
        assertThat(updated.bidAmount).isEqualByComparingTo(BigDecimal("1.23"))
    }

    @Test
    fun `키워드 일시정지는 상태만 보낸다`() {
        // given
        val client = client()

        // when
        client.updateKeyword(CAMPAIGN_ID, AD_GROUP_ID, KEYWORD_ID, "PAUSED", null, null)

        // then
        val body = requestBodies.single()[0]
        assertThat(body["status"].asText()).isEqualTo("PAUSED")
        assertThat(body.has("bidAmount")).isFalse()
    }

    @Test
    fun `키워드를 만들고 지운다`() {
        // given
        val client = client()

        // when
        val created = client.createKeyword(CAMPAIGN_ID, AD_GROUP_ID, "소개팅 앱", "EXACT", BigDecimal("1.45"), "USD")
        client.deleteKeyword(CAMPAIGN_ID, AD_GROUP_ID, created.id)

        // then
        assertThat(requests[0]).isEqualTo(
            "POST" to "/campaigns/$CAMPAIGN_ID/adgroups/$AD_GROUP_ID/targetingkeywords/bulk",
        )
        assertThat(requestBodies[0][0]["text"].asText()).isEqualTo("소개팅 앱")
        assertThat(requestBodies[0][0]["matchType"].asText()).isEqualTo("EXACT")
        assertThat(requestBodies[0][0]["bidAmount"]["amount"].asText()).isEqualTo("1.45")
        assertThat(created.id).isEqualTo(KEYWORD_ID)
        assertThat(requests[1]).isEqualTo("POST" to "$KEYWORDS_PATH/delete/bulk")
        assertThat(requestBodies[1].toString()).isEqualTo("[$KEYWORD_ID]")
    }

    @Test
    fun `제외 키워드를 만들고 지운다`() {
        // given
        val client = client()

        // when
        val created = client.createNegativeKeyword(CAMPAIGN_ID, AD_GROUP_ID, "디스코드", "EXACT")
        client.deleteNegativeKeyword(CAMPAIGN_ID, AD_GROUP_ID, created.id)

        // then
        assertThat(requests[0]).isEqualTo(
            "POST" to "/campaigns/$CAMPAIGN_ID/adgroups/$AD_GROUP_ID/negativekeywords/bulk",
        )
        assertThat(requestBodies[0][0]["text"].asText()).isEqualTo("디스코드")
        assertThat(created.id).isEqualTo(NEGATIVE_KEYWORD_ID)
        assertThat(created.matchType).isEqualTo("EXACT")
        assertThat(requests[1]).isEqualTo("POST" to "$NEGATIVE_KEYWORDS_PATH/delete/bulk")
        assertThat(requestBodies[1].toString()).isEqualTo("[$NEGATIVE_KEYWORD_ID]")
    }

    private fun client(orgId: String = ORG_ID): AppleAdsApiClient {
        val tokenProvider = mockk<AppleAdsTokenProvider>()
        every { tokenProvider.accessToken() } returns TOKEN

        return AppleAdsApiClient(
            AppleAdsProperties(orgId = orgId, apiUrl = "http://localhost:${server.address.port}"),
            tokenProvider,
        )
    }

    private fun record(exchange: HttpExchange, body: String) {
        requests.add(exchange.requestMethod to exchange.requestURI.path)
        requestBodies.add(objectMapper.readTree(exchange.requestBody.readAllBytes()))
        respond(exchange, body)
    }

    private fun respond(exchange: HttpExchange, body: String) {
        headers["Authorization"] = exchange.requestHeaders.getFirst("Authorization")
        headers["X-AP-Context"] = exchange.requestHeaders.getFirst("X-AP-Context")
        val bytes = body.toByteArray()
        exchange.responseHeaders.add("Content-Type", "application/json")
        exchange.sendResponseHeaders(responseStatus, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
    }

    companion object {

        private const val TOKEN = "access-token"
        private const val ORG_ID = "22327140"
        private const val CAMPAIGN_ID = 1000L
        private const val AD_GROUP_ID = 542317095L
        private const val KEYWORD_ID = 87675432L
        private const val NEGATIVE_KEYWORD_ID = 99001L
        private const val KEYWORDS_PATH = "/campaigns/$CAMPAIGN_ID/adgroups/$AD_GROUP_ID/targetingkeywords"
        private const val NEGATIVE_KEYWORDS_PATH = "/campaigns/$CAMPAIGN_ID/adgroups/$AD_GROUP_ID/negativekeywords"

        private val START: LocalDate = LocalDate.of(2026, 9, 1)
        private val END: LocalDate = LocalDate.of(2026, 9, 2)

        private const val ACLS_BODY = """{"data":[{"orgName":"Jipkok","orgId":123456,"currency":"KRW",""" +
            """"timeZone":"Asia/Seoul","paymentModel":"PAYG","roleNames":["API Account Manager"],""" +
            """"parentOrgId":null,"displayName":"Jipkok"}],"pagination":null,"error":null}"""

        private const val CAMPAIGNS_BODY = """{"data":[""" +
            """{"id":$CAMPAIGN_ID,"orgId":22327140,"name":"Jipkok KR","status":"ENABLED","deleted":false},""" +
            """{"id":1001,"orgId":22327140,"name":"Old","status":"PAUSED","deleted":true}""" +
            """],"pagination":{"totalResults":2,"startIndex":0,"itemsPerPage":1000}}"""

        private const val KEYWORD_LIST_BODY = """{"data":[{"id":$KEYWORD_ID,"adGroupId":$AD_GROUP_ID,""" +
            """"text":"소개팅 앱","status":"PAUSED","matchType":"EXACT",""" +
            """"bidAmount":{"amount":"1.23","currency":"USD"},"deleted":false}]}"""

        private const val NEGATIVE_KEYWORD_LIST_BODY = """{"data":[{"id":$NEGATIVE_KEYWORD_ID,""" +
            """"campaignId":$CAMPAIGN_ID,"adGroupId":$AD_GROUP_ID,"text":"디스코드","status":"ACTIVE",""" +
            """"matchType":"EXACT","deleted":false}]}"""

        private const val COUNT_BODY = """{"data":1,"pagination":null,"error":null}"""

        private const val KEYWORD_ROW = """{"other":false,"metadata":{"keywordId":87675432,"keyword":"dating app",""" +
            """"keywordStatus":"ACTIVE","matchType":"EXACT","bidAmount":{"amount":"1.50","currency":"USD"},""" +
            """"deleted":false,"adGroupId":542317095,"adGroupName":"Ad Group 1","adGroupDeleted":false},""" +
            """"insights":{"bidRecommendation":{"bidMin":{"amount":"null","currency":"null"},""" +
            """"bidMax":{"amount":"null","currency":"null"},""" +
            """"suggestedBidAmount":{"amount":"2.40","currency":"USD"}}},""" +
            """"granularity":[""" +
            """{"date":"2026-09-01","impressions":76,"taps":45,"totalInstalls":16,"tapInstalls":10,""" +
            """"viewInstalls":6,"totalNewDownloads":12,"totalRedownloads":4,""" +
            """"localSpend":{"amount":"12.34","currency":"USD"}},""" +
            """{"date":"2026-09-02","impressions":3,"taps":0,"totalInstalls":0,"tapInstalls":0,""" +
            """"viewInstalls":0,"totalNewDownloads":0,"totalRedownloads":0,""" +
            """"localSpend":{"amount":"0","currency":"USD"}}]}"""

        private const val SEARCH_TERM_ROWS = """{"other":false,"metadata":{"keywordId":null,"keyword":null,""" +
            """"matchType":null,"adGroupId":542317095,"adGroupName":"Ad Group 1","searchTermText":"소개팅 앱",""" +
            """"searchTermSource":"AUTO","countryOrRegion":"KR"},"granularity":[""" +
            """{"date":"2026-09-01","impressions":30,"taps":4,"totalInstalls":1,"tapInstalls":1,""" +
            """"viewInstalls":0,"totalNewDownloads":1,"totalRedownloads":0,""" +
            """"localSpend":{"amount":"2.00","currency":"USD"}}]},""" +
            """{"other":true,"metadata":{"searchTermText":null,"adGroupId":542317095},""" +
            """"granularity":[{"date":"2026-09-01","impressions":9,"taps":0}]}"""
    }
}
