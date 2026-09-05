package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.dto.SmsMessage
import com.blueoauld.server.domain.auth.dto.SmsMessagePage
import com.blueoauld.server.domain.auth.dto.SmsMessageStatus
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.SolapiProperties
import com.solapi.sdk.SolapiClient
import com.solapi.sdk.message.dto.request.MessageListRequest
import com.solapi.sdk.message.model.Message
import com.solapi.sdk.message.model.MessageStatusType
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import java.time.Instant

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${solapi.api-key:}'.isEmpty()")
class SolapiSmsMessageLog(

    properties: SolapiProperties,
) : SmsMessageLog {

    private val messageService = SolapiClient.createInstance(properties.apiKey, properties.apiSecret)

    override fun find(to: String?, status: SmsMessageStatus?, startKey: String?, limit: Int): SmsMessagePage {
        val request = MessageListRequest().also {
            it.to = to
            it.status = status?.let { s -> MessageStatusType.valueOf(s.name) }
            it.startKey = startKey
            it.limit = limit
        }

        val response = try {
            messageService.getMessageList(request)
        } catch (e: Exception) {
            log.error(e) { "문자 발송 내역을 불러오지 못했다." }
            throw BusinessException(ErrorCode.SMS_LOG_UNAVAILABLE)
        }

        return SmsMessagePage(
            messages = response?.messageList?.values?.map { toSmsMessage(it) }.orEmpty(),
            nextKey = response?.nextKey,
        )
    }

    companion object {

        fun toSmsMessage(message: Message) = SmsMessage(
            messageId = message.messageId.orEmpty(),
            to = message.to.orEmpty(),
            from = message.from,
            text = message.text,
            type = message.type?.name,
            status = message.status?.let { s -> SmsMessageStatus.entries.firstOrNull { it.name == s } },
            statusCode = message.statusCode,
            createdAt = message.dateCreated?.let { parseInstant(it) },
            receivedAt = message.dateReceived?.let { parseInstant(it) },
        )

        private fun parseInstant(value: String) = runCatching { Instant.parse(value) }.getOrNull()
    }
}
