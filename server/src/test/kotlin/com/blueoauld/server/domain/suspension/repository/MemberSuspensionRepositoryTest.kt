package com.blueoauld.server.domain.suspension.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
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

    @Autowired
    private lateinit var memberRepository: MemberRepository

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
        save(expiresAt = null, phoneNumber = "+821099998888")

        // when
        val exists = existsActive(SuspensionType.SERVICE)

        // then
        assertThat(exists).isFalse()
    }

    @Test
    fun `번호가 같으면 다시 가입한 계정도 정지로 본다`() {
        // given
        val rejoined = saveMember(PHONE_NUMBER)
        save(expiresAt = null)

        // when
        val active = memberSuspensionRepository.findActive(rejoined.id, NOW)

        // then
        assertThat(active).hasSize(1)
        assertThat(memberSuspensionRepository.existsActive(rejoined.id, SuspensionType.SERVICE, NOW)).isTrue()
    }

    @Test
    fun `해제됐거나 만료된 정지는 활성 목록에서 뺀다`() {
        // given
        val member = saveMember(PHONE_NUMBER)
        save(expiresAt = null, type = SuspensionType.SERVICE)
        save(expiresAt = NOW.minusSeconds(60), type = SuspensionType.PROFILE_EDIT)
        save(expiresAt = null, type = SuspensionType.SECRET_PHOTO, released = true)

        // when
        val active = memberSuspensionRepository.findActive(member.id, NOW)

        // then
        assertThat(active.map { it.type }).containsExactly(SuspensionType.SERVICE)
    }

    @Test
    fun `번호가 다르면 활성 목록에 담지 않는다`() {
        // given
        val other = saveMember("+821033334444")
        save(expiresAt = null)

        // when
        val active = memberSuspensionRepository.findActive(other.id, NOW)

        // then
        assertThat(active).isEmpty()
    }

    @Test
    fun `번호와 유형으로 유효한 정지만 찾는다`() {
        // given
        save(expiresAt = null, type = SuspensionType.SERVICE)
        save(expiresAt = NOW.minusSeconds(60), type = SuspensionType.SERVICE)
        save(expiresAt = null, type = SuspensionType.SERVICE, released = true)
        save(expiresAt = null, type = SuspensionType.PROFILE_EDIT)
        save(expiresAt = null, type = SuspensionType.SERVICE, phoneNumber = "+821033334444")

        // when
        val active = memberSuspensionRepository.findActiveByPhoneNumber(PHONE_NUMBER, SuspensionType.SERVICE, NOW)

        // then
        assertThat(active).hasSize(1)
        assertThat(active.single().expiresAt).isNull()
        assertThat(active.single().releasedAt).isNull()
    }

    @Test
    fun `보관 기간이 지난 해제, 만료 정지만 정리 대상으로 준다`() {
        // given
        save(expiresAt = null, type = SuspensionType.SERVICE, released = true)
        save(expiresAt = NOW.minusSeconds(120), type = SuspensionType.PROFILE_EDIT)
        save(expiresAt = null, type = SuspensionType.SECRET_PHOTO)

        // when
        val ids = memberSuspensionRepository.findIdsExpiredBefore(NOW)

        // then
        val all = memberSuspensionRepository.findAll().associateBy { it.id }
        assertThat(ids.map { all.getValue(it).type })
            .containsExactlyInAnyOrder(SuspensionType.SERVICE, SuspensionType.PROFILE_EDIT)
    }

    private fun saveMember(phoneNumber: String) = memberRepository.saveAndFlush(
        Member(
            phoneNumber = phoneNumber,
            password = "encoded-password",
            gender = Gender.MALE,
            nickname = phoneNumber.takeLast(10),
            birthYear = 1998,
        ),
    )

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
        private const val PHONE_NUMBER = "+821011112222"

        private val NOW: Instant = Instant.parse("2026-08-21T00:00:00Z")
    }
}
