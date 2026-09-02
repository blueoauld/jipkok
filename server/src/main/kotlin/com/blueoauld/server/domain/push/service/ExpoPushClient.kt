package com.blueoauld.server.domain.push.service

import com.blueoauld.server.domain.push.dto.ExpoPushMessage
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class ExpoPushClient {

    private val restClient = RestClient.builder()
        .requestFactory(
            SimpleClientHttpRequestFactory().apply {
                setConnectTimeout(CONNECT_TIMEOUT)
                setReadTimeout(READ_TIMEOUT)
            },
        )
        .build()

    fun send(messages: List<ExpoPushMessage>): List<String> {
        if (messages.isEmpty()) {
            return emptyList()
        }

        val response = runCatching {
            restClient.post()
                .uri(SEND_URL)
                .body(messages)
                .retrieve()
                .body<ExpoPushResponse>()
        }.onFailure { log.error(it) { "푸시를 보내지 못했다. size=${messages.size}" } }
            .getOrNull()
            ?: return emptyList()

        return response.data.orEmpty()
            .withIndex()
            .filter { (_, ticket) -> ticket.details?.error == DEVICE_NOT_REGISTERED }
            .map { (index, _) -> messages[index].to }
    }

    private data class ExpoPushResponse(val data: List<ExpoPushTicket>?)

    private data class ExpoPushTicket(val status: String?, val details: ExpoPushTicketDetails?)

    private data class ExpoPushTicketDetails(val error: String?)

    companion object {

        private const val SEND_URL = "https://exp.host/--/api/v2/push/send"

        private const val DEVICE_NOT_REGISTERED = "DeviceNotRegistered"

        private val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(2)
        private val READ_TIMEOUT: Duration = Duration.ofSeconds(10)
    }
}
