package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.entity.PhoneVerification
import com.blueoauld.server.domain.auth.repository.PhoneVerificationRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class VerificationCodeServiceTest {

    private val phoneVerificationRepository = mockk<PhoneVerificationRepository>()

    private val verificationCodeSender = mockk<VerificationCodeSender>(relaxed = true)

    private val verificationCodeService = VerificationCodeService(
        phoneVerificationRepository,
        verificationCodeSender,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { phoneVerificationRepository.save(any()) } answers { firstArg() }
        every { phoneVerificationRepository.findFirstByPhoneNumberOrderByIssuedAtDesc(PHONE_NUMBER) } returns null
        every {
            phoneVerificationRepository.countByPhoneNumberAndIssuedAtGreaterThanEqual(PHONE_NUMBER, any())
        } returns 0
    }

    @Test
    fun `발송 이력이 없으면 여섯 자리 인증번호를 저장하고 같은 인증번호를 발송한다`() {
        // given
        val saved = slot<PhoneVerification>()
        val sentCode = slot<String>()

        // when
        verificationCodeService.send(PHONE_NUMBER)

        // then
        verify { phoneVerificationRepository.save(capture(saved)) }
        verify { verificationCodeSender.send(PHONE_NUMBER, capture(sentCode)) }
        assertThat(saved.captured.phoneNumber).isEqualTo(PHONE_NUMBER)
        assertThat(saved.captured.code).matches("\\d{6}")
        assertThat(saved.captured.issuedAt).isEqualTo(NOW)
        assertThat(sentCode.captured).isEqualTo(saved.captured.code)
    }

    @Test
    fun `재발송 대기 시간이 지나지 않았으면 발송하지 않는다`() {
        // given
        stubLatestIssuedAt(NOW.minus(VerificationCodeService.RESEND_COOLDOWN).plusSeconds(1))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            verificationCodeService.send(PHONE_NUMBER)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.VERIFICATION_CODE_RESEND_TOO_SOON)
        verify(exactly = 0) { verificationCodeSender.send(any(), any()) }
    }

    @Test
    fun `재발송 대기 시간이 정확히 지났으면 발송한다`() {
        // given
        stubLatestIssuedAt(NOW.minus(VerificationCodeService.RESEND_COOLDOWN))

        // when
        verificationCodeService.send(PHONE_NUMBER)

        // then
        verify(exactly = 1) { verificationCodeSender.send(PHONE_NUMBER, any()) }
    }

    @Test
    fun `시간당 발송 한도를 채웠으면 발송하지 않는다`() {
        // given
        stubIssuedCount(VerificationCodeService.HOURLY_SEND_LIMIT.toLong())

        // when
        val exception = assertThrows(BusinessException::class.java) {
            verificationCodeService.send(PHONE_NUMBER)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.VERIFICATION_CODE_SEND_LIMIT_EXCEEDED)
        verify(exactly = 0) { verificationCodeSender.send(any(), any()) }
    }

    @Test
    fun `시간당 발송 한도에 한 번 모자라면 발송한다`() {
        // given
        stubIssuedCount(VerificationCodeService.HOURLY_SEND_LIMIT - 1L)

        // when
        verificationCodeService.send(PHONE_NUMBER)

        // then
        verify(exactly = 1) { verificationCodeSender.send(PHONE_NUMBER, any()) }
    }

    private fun stubLatestIssuedAt(issuedAt: Instant) {
        every { phoneVerificationRepository.findFirstByPhoneNumberOrderByIssuedAtDesc(PHONE_NUMBER) } returns
            PhoneVerification(PHONE_NUMBER, "123456", issuedAt)
    }

    private fun stubIssuedCount(count: Long) {
        every {
            phoneVerificationRepository.countByPhoneNumberAndIssuedAtGreaterThanEqual(PHONE_NUMBER, any())
        } returns count
    }

    companion object {

        private const val PHONE_NUMBER = "01012345678"
        private val NOW: Instant = Instant.parse("2026-07-31T00:00:00Z")
    }
}
