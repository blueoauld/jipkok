package com.blueoauld.server.global.push

import com.fasterxml.jackson.annotation.JsonInclude
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.body

private val log = KotlinLogging.logger {}

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ExpoPushMessage(

    val to: String,
    val title: String,
    val body: String,
    val data: Map<String, String> = emptyMap(),
    val collapseId: String? = null,
    val tag: String? = null,
    val sound: String = SOUND,
) {

    companion object {

        private const val SOUND = "default"
    }
}

@Component
class ExpoPushClient {

    private val restClient = RestClient.create()

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
    }
}
