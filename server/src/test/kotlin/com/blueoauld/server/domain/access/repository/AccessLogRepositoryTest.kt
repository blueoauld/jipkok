package com.blueoauld.server.domain.access.repository

import com.blueoauld.server.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class AccessLogRepositoryTest {

    @Autowired
    private lateinit var accessLogRepository: AccessLogRepository

    @Test
    fun `같은 날 다시 접속하면 행을 늘리지 않고 앱 버전만 갱신한다`() {
        // given
        upsert(appVersion = "1.8.1", now = NOW)

        // when
        upsert(appVersion = "1.8.2", now = NOW.plusSeconds(3600))

        // then
        val logs = accessLogRepository.findAll().filter { it.memberId == MEMBER_ID }
        assertThat(logs).hasSize(1)
        assertThat(logs.first().appVersion).isEqualTo("1.8.2")
    }

    @Test
    fun `버전 없이 다시 접속해도 기존 버전을 지우지 않는다`() {
        // given
        upsert(appVersion = "1.8.2", now = NOW)

        // when
        upsert(appVersion = null, now = NOW.plusSeconds(3600))

        // then
        val logs = accessLogRepository.findAll().filter { it.memberId == MEMBER_ID }
        assertThat(logs.first().appVersion).isEqualTo("1.8.2")
    }

    private fun upsert(appVersion: String?, now: Instant) {
        accessLogRepository.upsert(
            memberId = MEMBER_ID,
            phoneNumber = "+821011112222",
            platform = "IOS",
            deviceName = null,
            ipAddress = "127.0.0.1",
            accessedOn = TODAY,
            appVersion = appVersion,
            now = now,
        )
    }

    companion object {

        private const val MEMBER_ID = 9001L

        private val NOW: Instant = Instant.parse("2026-08-20T00:00:00Z")
        private val TODAY: LocalDate = LocalDate.of(2026, 8, 20)
    }
}
