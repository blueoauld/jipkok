package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.entity.PhoneVerification
import com.blueoauld.server.domain.auth.repository.PhoneVerificationRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.Clock
import java.time.Duration

@Service
class VerificationCodeService(

    private val phoneVerificationRepository: PhoneVerificationRepository,
    private val verificationCodeSender: VerificationCodeSender,
    private val clock: Clock,
) {

    private val random = SecureRandom()

    @Transactional
    fun send(phoneNumber: String) {
        val now = clock.instant()

        val latest = phoneVerificationRepository.findFirstByPhoneNumberOrderByIssuedAtDesc(phoneNumber)
        if (latest != null && now.isBefore(latest.issuedAt.plus(RESEND_COOLDOWN))) {
            throw BusinessException(ErrorCode.VERIFICATION_CODE_RESEND_TOO_SOON)
        }

        val issuedCount = phoneVerificationRepository.countByPhoneNumberAndIssuedAtGreaterThanEqual(
            phoneNumber,
            now.minus(SEND_LIMIT_WINDOW),
        )
        if (issuedCount >= HOURLY_SEND_LIMIT) {
            throw BusinessException(ErrorCode.VERIFICATION_CODE_SEND_LIMIT_EXCEEDED)
        }

        val code = generateCode()
        phoneVerificationRepository.save(PhoneVerification(phoneNumber, code, now))
        verificationCodeSender.send(phoneNumber, code)
    }

    private fun generateCode() = (1..PhoneVerification.CODE_LENGTH).joinToString("") {
        random.nextInt(RADIX).toString()
    }

    companion object {

        val RESEND_COOLDOWN: Duration = Duration.ofSeconds(30)
        val SEND_LIMIT_WINDOW: Duration = Duration.ofHours(1)
        const val HOURLY_SEND_LIMIT = 5

        private const val RADIX = 10
    }
}
