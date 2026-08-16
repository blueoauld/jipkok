package com.blueoauld.server.domain.push.service

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.push.entity.DeviceToken
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import com.blueoauld.server.domain.push.repository.DeviceTokenRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import org.springframework.transaction.support.TransactionTemplate

data class ExpiredTokenEvent(val token: String)

class ExpiredTokenListener(

    private val deviceTokenService: DeviceTokenService,
) {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onEvent(event: ExpiredTokenEvent) {
        deviceTokenService.removeExpired(listOf(event.token))
    }
}

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class DeviceTokenServiceCommitTest {

    @TestConfiguration
    class ListenerConfig {

        @Bean
        fun expiredTokenListener(deviceTokenService: DeviceTokenService) = ExpiredTokenListener(deviceTokenService)
    }

    @Autowired
    private lateinit var deviceTokenRepository: DeviceTokenRepository

    @Autowired
    private lateinit var eventPublisher: ApplicationEventPublisher

    @Autowired
    private lateinit var transactionManager: PlatformTransactionManager

    @AfterEach
    fun tearDown() {
        deviceTokenRepository.findAllByMemberId(MEMBER_ID).forEach { deviceTokenRepository.delete(it) }
    }

    @Test
    fun `커밋 뒤 리스너에서 지운 만료 토큰이 실제로 사라진다`() {
        // given
        deviceTokenRepository.save(DeviceToken(MEMBER_ID, TOKEN, DevicePlatform.IOS))

        // when
        TransactionTemplate(transactionManager).execute {
            eventPublisher.publishEvent(ExpiredTokenEvent(TOKEN))
        }

        // then
        assertThat(deviceTokenRepository.findByToken(TOKEN)).isNull()
    }

    companion object {

        private const val MEMBER_ID = 999999L
        private const val TOKEN = "ExponentPushToken[commit-test]"
    }
}
