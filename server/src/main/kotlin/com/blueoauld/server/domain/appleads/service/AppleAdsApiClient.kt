package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsOrg
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.AppleAdsProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import java.time.Duration

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

        val response = runCatching {
            restClient.get()
                .uri(ACLS_PATH)
                .headers { it.setBearerAuth(token) }
                .retrieve()
                .body<AclResponse>()
        }.onFailure { log.error(it) { "애플 광고 조직 목록을 불러오지 못했다." } }
            .getOrNull() ?: throw BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)

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

    private data class AclResponse(val data: List<Acl>?)

    private data class Acl(
        val orgId: Long,
        val orgName: String?,
        val currency: String?,
        val timeZone: String?,
        val roleNames: List<String>?,
    )

    companion object {

        private const val ACLS_PATH = "/acls"

        private val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(2)
        private val READ_TIMEOUT: Duration = Duration.ofSeconds(10)
    }
}
