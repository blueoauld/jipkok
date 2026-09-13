package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.auth.entity.PhoneVerification
import com.blueoauld.server.domain.auth.entity.type.VerificationPurpose
import com.blueoauld.server.domain.auth.repository.PhoneVerificationRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import java.time.Instant
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class VerificationCodeConcurrencyTest {

    @Autowired
    private lateinit var verificationCodeService: VerificationCodeService

    @Autowired
    private lateinit var phoneVerificationRepository: PhoneVerificationRepository

    private var verificationId: Long = 0

    @AfterEach
    fun tearDown() {
        phoneVerificationRepository.deleteById(verificationId)
    }

    @Test
    fun `틀린 번호를 동시에 보내도 시도 횟수 제한을 넘겨 확인하지 않는다`() {
        // given
        verificationId = phoneVerificationRepository.saveAndFlush(
            PhoneVerification(PHONE_NUMBER, CODE, IP_ADDRESS, Instant.now(), PURPOSE),
        ).id
        val start = CountDownLatch(1)

        // when
        val errorCodes = Executors.newFixedThreadPool(REQUEST_COUNT).use { executor ->
            val results = (1..REQUEST_COUNT).map {
                executor.submit(
                    Callable {
                        start.await()
                        runCatching { verificationCodeService.verify(PHONE_NUMBER, WRONG_CODE, PURPOSE) }
                            .exceptionOrNull()
                    },
                )
            }
            start.countDown()
            results.map { (it.get() as BusinessException).errorCode }
        }

        // then
        assertThat(errorCodes.count { it == ErrorCode.VERIFICATION_CODE_MISMATCH })
            .isEqualTo(VerificationCodeService.MAX_VERIFY_ATTEMPTS)
        assertThat(phoneVerificationRepository.findById(verificationId).get().attemptCount)
            .isEqualTo(VerificationCodeService.MAX_VERIFY_ATTEMPTS)
    }

    companion object {

        private const val PHONE_NUMBER = "+821077770000"
        private const val IP_ADDRESS = "127.0.0.1"
        private const val CODE = "123456"
        private const val WRONG_CODE = "000000"
        private const val REQUEST_COUNT = 8

        private val PURPOSE = VerificationPurpose.PASSWORD_RESET
    }
}
