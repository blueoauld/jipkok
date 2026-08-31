package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class AdminSuspensionQueriesTest {

    @Autowired
    private lateinit var memberSuspensionRepository: MemberSuspensionRepository

    @Autowired
    private lateinit var suspensionAdminRepository: SuspensionAdminRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    private var activeId = 0L

    private var expiredId = 0L

    private var releasedId = 0L

    @BeforeEach
    fun setUp() {
        activeId = save(memberId = 1, type = SuspensionType.SERVICE, expiresAt = NOW.plusSeconds(3600)).id
        expiredId = save(memberId = 1, type = SuspensionType.SECRET_PHOTO, expiresAt = NOW.minusSeconds(3600)).id
        releasedId = save(memberId = 2, type = SuspensionType.SERVICE, expiresAt = null, released = true).id
    }

    @Test
    fun `상태 필터가 정지, 만료, 해제를 가른다`() {
        // given

        // when
        val all = suspensionAdminRepository.findAllForAdmin(null, null, null, NOW, 20, 0)
        val active = suspensionAdminRepository.findAllForAdmin("ACTIVE", null, null, NOW, 20, 0)
        val expired = suspensionAdminRepository.findAllForAdmin("EXPIRED", null, null, NOW, 20, 0)
        val released = suspensionAdminRepository.findAllForAdmin("RELEASED", null, null, NOW, 20, 0)

        // then
        assertThat(all.map { it.id }).containsExactly(releasedId, expiredId, activeId)
        assertThat(active.map { it.id }).containsExactly(activeId)
        assertThat(expired.map { it.id }).containsExactly(expiredId)
        assertThat(released.map { it.id }).containsExactly(releasedId)
    }

    @Test
    fun `유형과 회원 ID로 거른다`() {
        // given

        // when
        val services = suspensionAdminRepository.findAllForAdmin(null, "SERVICE", null, NOW, 20, 0)
        val member1 = suspensionAdminRepository.findAllForAdmin(null, null, 1, NOW, 20, 0)
        val count = suspensionAdminRepository.countForAdmin("ACTIVE", "SERVICE", 1, NOW)

        // then
        assertThat(services.map { it.id }).containsExactly(releasedId, activeId)
        assertThat(member1.map { it.id }).containsExactly(expiredId, activeId)
        assertThat(count).isEqualTo(1)
    }

    @Test
    fun `회원 ID 필터는 같은 전화번호의 이전 계정 정지도 준다`() {
        // given
        val current = memberRepository.saveAndFlush(
            Member(
                phoneNumber = "+821011112221",
                password = "encoded-password",
                gender = Gender.MALE,
                nickname = "재가입회원",
                birthYear = 1998,
            ),
        )

        // when
        val suspensions = suspensionAdminRepository.findAllForAdmin(null, null, current.id, NOW, 20, 0)

        // then
        assertThat(suspensions.map { it.id }).containsExactly(expiredId, activeId)
    }

    @Test
    fun `페이지 크기와 오프셋을 적용한다`() {
        // given

        // when
        val firstPage = suspensionAdminRepository.findAllForAdmin(null, null, null, NOW, 2, 0)
        val secondPage = suspensionAdminRepository.findAllForAdmin(null, null, null, NOW, 2, 2)

        // then
        assertThat(firstPage).hasSize(2)
        assertThat(secondPage.map { it.id }).containsExactly(activeId)
    }

    private fun save(
        memberId: Long,
        type: SuspensionType,
        expiresAt: Instant?,
        released: Boolean = false,
    ): MemberSuspension {
        val suspension = MemberSuspension(
            phoneNumber = "+82101111222$memberId",
            memberId = memberId,
            nickname = "회원$memberId",
            type = type,
            reason = SuspensionReason.ABUSE,
            startedAt = NOW.minusSeconds(7200),
            expiresAt = expiresAt,
        )

        if (released) suspension.releasedAt = NOW.minusSeconds(60)

        return memberSuspensionRepository.saveAndFlush(suspension)
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-20T00:00:00Z")
    }
}
