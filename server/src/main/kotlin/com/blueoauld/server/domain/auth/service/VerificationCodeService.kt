package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.entity.PhoneVerification
import com.blueoauld.server.domain.auth.repository.PhoneVerificationRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
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
    fun send(phoneNumber: String, ipAddress: String) {
        val now = clock.instant()
        val since = now.minus(SEND_LIMIT_WINDOW)

        val latest = phoneVerificationRepository.findFirstByPhoneNumberOrderByIssuedAtDesc(phoneNumber)
        if (latest != null && now.isBefore(latest.issuedAt.plus(RESEND_COOLDOWN))) {
            throw BusinessException(ErrorCode.VERIFICATION_CODE_RESEND_TOO_SOON)
        }

        if (phoneVerificationRepository.countByPhoneNumberAndIssuedAtGreaterThanEqual(phoneNumber, since)
            >= HOURLY_SEND_LIMIT
        ) {
            throw BusinessException(ErrorCode.VERIFICATION_CODE_SEND_LIMIT_EXCEEDED)
        }

        if (phoneVerificationRepository.countByIpAddressAndIssuedAtGreaterThanEqual(ipAddress, since)
            >= HOURLY_IP_SEND_LIMIT
        ) {
            throw BusinessException(ErrorCode.VERIFICATION_CODE_IP_LIMIT_EXCEEDED)
        }

        val code = generateCode()
        phoneVerificationRepository.save(PhoneVerification(phoneNumber, code, ipAddress, now))
        verificationCodeSender.send(phoneNumber, code)
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = [BusinessException::class])
    fun verify(phoneNumber: String, code: String) {
        val now = clock.instant()

        val latest = phoneVerificationRepository.findFirstByPhoneNumberOrderByIssuedAtDesc(phoneNumber)
            ?: throw BusinessException(ErrorCode.VERIFICATION_CODE_NOT_FOUND)

        if (latest.usedAt != null) {
            throw BusinessException(ErrorCode.VERIFICATION_CODE_ALREADY_USED)
        }

        if (!now.isBefore(latest.issuedAt.plus(CODE_TIME_TO_LIVE))) {
            throw BusinessException(ErrorCode.VERIFICATION_CODE_EXPIRED)
        }

        if (latest.attemptCount >= MAX_VERIFY_ATTEMPTS) {
            throw BusinessException(ErrorCode.VERIFICATION_CODE_ATTEMPT_EXCEEDED)
        }

        latest.increaseAttemptCount()

        if (latest.code != code) {
            throw BusinessException(ErrorCode.VERIFICATION_CODE_MISMATCH)
        }

        latest.use(now)
    }

    private fun generateCode() = (1..PhoneVerification.CODE_LENGTH).joinToString("") {
        random.nextInt(RADIX).toString()
    }

    companion object {

        val RESEND_COOLDOWN: Duration = Duration.ofSeconds(30)
        val SEND_LIMIT_WINDOW: Duration = Duration.ofHours(1)
        val CODE_TIME_TO_LIVE: Duration = Duration.ofMinutes(3)
        const val HOURLY_SEND_LIMIT = 5
        const val HOURLY_IP_SEND_LIMIT = 10
        const val MAX_VERIFY_ATTEMPTS = 5

        private const val RADIX = 10
    }
}
