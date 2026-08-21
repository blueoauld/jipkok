package com.blueoauld.server.domain.suspension.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class MemberSuspensionRepositoryTest {

    @Autowired
    private lateinit var memberSuspensionRepository: MemberSuspensionRepository

    @Test
    fun `정지 중인 번호를 찾는다`() {
        // given
        save(expiresAt = NOW.plusSeconds(3600))

        // when
        val exists = existsActive(SuspensionType.SERVICE)

        // then
        assertThat(exists).isTrue()
    }

    @Test
    fun `만료가 없으면 영구 정지로 본다`() {
        // given
        save(expiresAt = null)

        // when
        val exists = existsActive(SuspensionType.SERVICE)

        // then
        assertThat(exists).isTrue()
    }

    @Test
    fun `만료됐거나 해제된 정지는 세지 않는다`() {
        // given
        save(expiresAt = NOW.minusSeconds(3600))
        save(expiresAt = null, released = true)

        // when
        val exists = existsActive(SuspensionType.SERVICE)

        // then
        assertThat(exists).isFalse()
    }

    @Test
    fun `다른 유형의 정지는 세지 않는다`() {
        // given
        save(expiresAt = null, type = SuspensionType.SECRET_PHOTO)

        // when
        val exists = existsActive(SuspensionType.SERVICE)

        // then
        assertThat(exists).isFalse()
    }

    @Test
    fun `다른 번호의 정지는 세지 않는다`() {
        // given
        save(expiresAt = null, phoneNumber = "01099998888")

        // when
        val exists = existsActive(SuspensionType.SERVICE)

        // then
        assertThat(exists).isFalse()
    }

    private fun existsActive(type: SuspensionType) =
        memberSuspensionRepository.existsActiveByPhoneNumber(PHONE_NUMBER, type, NOW)

    private fun save(
        expiresAt: Instant?,
        type: SuspensionType = SuspensionType.SERVICE,
        phoneNumber: String = PHONE_NUMBER,
        released: Boolean = false,
    ) {
        val suspension = MemberSuspension(
            phoneNumber = phoneNumber,
            memberId = MEMBER_ID,
            nickname = "홍길동",
            type = type,
            reason = SuspensionReason.ABUSE,
            startedAt = NOW.minusSeconds(7200),
            expiresAt = expiresAt,
        )

        if (released) {
            suspension.releasedAt = NOW.minusSeconds(60)
        }

        memberSuspensionRepository.saveAndFlush(suspension)
    }

    companion object {

        private const val MEMBER_ID = 1L
        private const val PHONE_NUMBER = "01011112222"

        private val NOW: Instant = Instant.parse("2026-08-21T00:00:00Z")
    }
}
