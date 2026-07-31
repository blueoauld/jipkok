package com.blueoauld.server.domain.auth.service

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class LoggingVerificationCodeSender : VerificationCodeSender {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun send(phoneNumber: String, code: String) {
        log.info("인증번호를 발송한다. phoneNumber={}, code={}", phoneNumber, code)
    }
}
