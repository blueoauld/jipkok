package com.blueoauld.server.domain.auth.service

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
class LoggingVerificationCodeSender : VerificationCodeSender {

    override fun send(phoneNumber: String, code: String) {
        log.info { "인증번호를 발송한다. phoneNumber=$phoneNumber, code=$code" }
    }
}
