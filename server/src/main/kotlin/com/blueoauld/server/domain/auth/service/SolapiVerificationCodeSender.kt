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
        val dialCode = dialCodeOf(phoneNumber) ?: run {
            log.error { "국가 코드를 알 수 없어 인증번호를 보내지 못했다. phoneNumber=$phoneNumber" }
            throw BusinessException(ErrorCode.VERIFICATION_CODE_SEND_FAILED)
        }

        val message = Message().apply {
            from = properties.senderNumber
            country = dialCode.removePrefix(PLUS)
            to = nationalOf(phoneNumber, dialCode)
            text = "$MESSAGE_PREFIX $code"
        }

        try {
            messageService.send(message, null)
        } catch (e: Exception) {
            log.error(e) { "인증번호를 보내지 못했다. phoneNumber=$phoneNumber" }
            throw BusinessException(ErrorCode.VERIFICATION_CODE_SEND_FAILED)
        }
    }

    companion object {

        private const val MESSAGE_PREFIX = "JIPKOK Verification Code:"
        private const val PLUS = "+"
        private const val TRUNK_PREFIX = "0"

        private val DIAL_CODES = listOf("+82", "+81")

        fun dialCodeOf(phoneNumber: String) = DIAL_CODES.firstOrNull { phoneNumber.startsWith(it) }

        fun nationalOf(phoneNumber: String, dialCode: String) = TRUNK_PREFIX + phoneNumber.removePrefix(dialCode)
    }
}
