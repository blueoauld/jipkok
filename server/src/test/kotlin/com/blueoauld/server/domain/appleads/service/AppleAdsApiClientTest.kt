package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.AppleAdsProperties
import com.sun.net.httpserver.HttpServer
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.net.InetSocketAddress
import java.util.concurrent.atomic.AtomicReference

class AppleAdsApiClientTest {

    private lateinit var server: HttpServer

    private lateinit var client: AppleAdsApiClient

    private val authorization = AtomicReference<String?>(null)

    private var responseStatus = 200

    @BeforeEach
    fun setUp() {
        server = HttpServer.create(InetSocketAddress(0), 0)
        server.createContext("/acls") { exchange ->
            authorization.set(exchange.requestHeaders.getFirst("Authorization"))
            val body = ACLS_BODY.toByteArray()
            exchange.responseHeaders.add("Content-Type", "application/json")
            exchange.sendResponseHeaders(responseStatus, body.size.toLong())
            exchange.responseBody.use { it.write(body) }
        }
        server.start()

        val tokenProvider = mockk<AppleAdsTokenProvider>()
        every { tokenProvider.accessToken() } returns TOKEN

        client = AppleAdsApiClient(
            AppleAdsProperties(apiUrl = "http://localhost:${server.address.port}"),
            tokenProvider,
        )
    }

    @AfterEach
    fun tearDown() {
        server.stop(0)
    }

    @Test
    fun `토큰을 붙여 조직 목록을 가져온다`() {
        // given

        // when
        val orgs = client.findOrgs()

        // then
        assertThat(authorization.get()).isEqualTo("Bearer $TOKEN")
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

        // when
        val exception = assertThrows(BusinessException::class.java) { client.findOrgs() }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.APPLE_ADS_UNAVAILABLE)
    }

    companion object {

        private const val TOKEN = "access-token"
        private const val ACLS_BODY = """{"data":[{"orgName":"Jipkok","orgId":123456,"currency":"KRW",""" +
            """"timeZone":"Asia/Seoul","paymentModel":"PAYG","roleNames":["API Account Manager"],""" +
            """"parentOrgId":null,"displayName":"Jipkok"}],"pagination":null,"error":null}"""
    }
}
