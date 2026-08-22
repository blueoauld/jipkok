package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.SolapiProperties
import com.solapi.sdk.SolapiClient
import com.solapi.sdk.message.model.Message
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${solapi.api-key:}'.isEmpty()")
class SolapiVerificationCodeSender(

    private val properties: SolapiProperties,
) : VerificationCodeSender {

    private val messageService = SolapiClient.createInstance(properties.apiKey, properties.apiSecret)

    override fun send(phoneNumber: String, code: String) {
        if (!phoneNumber.startsWith(KOREA_DIAL_CODE)) {
            log.error { "국내 번호가 아니라 인증번호를 보내지 못했다. phoneNumber=$phoneNumber" }
            throw BusinessException(ErrorCode.VERIFICATION_CODE_SEND_FAILED)
        }

        val message = Message().apply {
            from = properties.senderNumber
            to = toDomestic(phoneNumber)
            text = "$MESSAGE_PREFIX $code"
        }

        try {
            messageService.send(message, null)
        } catch (e: Exception) {
            log.error(e) { "인증번호를 보내지 못했다. phoneNumber=$phoneNumber" }
            throw BusinessException(ErrorCode.VERIFICATION_CODE_SEND_FAILED)
        }
    }

    private fun toDomestic(phoneNumber: String) = "0" + phoneNumber.removePrefix(KOREA_DIAL_CODE)

    companion object {

        private const val MESSAGE_PREFIX = "[집콕] 인증번호"
        private const val KOREA_DIAL_CODE = "+82"
    }
}
