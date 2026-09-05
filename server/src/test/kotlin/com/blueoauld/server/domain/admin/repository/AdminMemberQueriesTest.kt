package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.NicknameHistory
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
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
class AdminMemberQueriesTest {

    @Autowired
    private lateinit var memberAdminRepository: MemberAdminRepository

    @Autowired
    private lateinit var memberSuspensionRepository: MemberSuspensionRepository

    @Autowired
    private lateinit var nicknameHistoryAdminRepository: NicknameHistoryAdminRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    private var normalId = 0L

    private var suspendedId = 0L

    private var withdrawnId = 0L

    @BeforeEach
    fun setUp() {
        normalId = saveMember("+821011112222", "밤산책", Gender.MALE).id
        suspendedId = saveMember("+821033334444", "구름빵", Gender.FEMALE).id
        val withdrawn = saveMember("+821055556666", "초록불", Gender.MALE)
        withdrawnId = withdrawn.id

        memberSuspensionRepository.saveAndFlush(
            MemberSuspension(
                phoneNumber = "+821033334444",
                memberId = suspendedId,
                nickname = "구름빵",
                type = SuspensionType.SERVICE,
                reason = SuspensionReason.ABUSE,
                startedAt = NOW.minusSeconds(3600),
                expiresAt = NOW.plusSeconds(3600),
            ),
        )
        memberAdminRepository.delete(withdrawn)
        entityManager.flush()
        entityManager.clear()
    }

    @Test
    fun `상태 필터가 정상, 정지, 탈퇴를 가른다`() {
        // given

        // when
        val all = memberAdminRepository.findAllForAdmin(null, null, null, null, null, NOW, 20, 0)
        val normal = memberAdminRepository.findAllForAdmin("NORMAL", null, null, null, null, NOW, 20, 0)
        val suspended = memberAdminRepository.findAllForAdmin("SUSPENDED", null, null, null, null, NOW, 20, 0)
        val withdrawn = memberAdminRepository.findAllForAdmin("WITHDRAWN", null, null, null, null, NOW, 20, 0)

        // then
        assertThat(all.map { it.id }).contains(normalId, suspendedId, withdrawnId)
        assertThat(normal.map { it.id }).contains(normalId).doesNotContain(suspendedId, withdrawnId)
        assertThat(suspended.map { it.id }).containsExactly(suspendedId)
        assertThat(withdrawn.map { it.id }).containsExactly(withdrawnId)
        assertThat(withdrawn.first().withdrawnAt).isNotNull()
        assertThat(suspended.first().suspended).isTrue()
    }

    @Test
    fun `검색어가 숫자면 ID나 전화번호, 아니면 닉네임에 맞춘다`() {
        // given

        // when
        val byPhone = memberAdminRepository.findAllForAdmin(null, null, 0, "%3333%", null, NOW, 20, 0)
        val byId = memberAdminRepository.findAllForAdmin(null, null, normalId, "%$normalId%", null, NOW, 20, 0)
        val byNickname = memberAdminRepository.findAllForAdmin(null, null, null, null, "%구름%", NOW, 20, 0)

        // then
        assertThat(byPhone.map { it.id }).containsExactly(suspendedId)
        assertThat(byId.map { it.id }).contains(normalId)
        assertThat(byNickname.map { it.id }).containsExactly(suspendedId)
    }

    @Test
    fun `성별 필터와 개수를 준다`() {
        // given

        // when
        val females = memberAdminRepository.findAllForAdmin(null, "FEMALE", null, null, null, NOW, 20, 0)
        val count = memberAdminRepository.countForAdmin("WITHDRAWN", null, null, null, null, NOW)

        // then
        assertThat(females.map { it.id }).containsExactly(suspendedId)
        assertThat(count).isEqualTo(1)
    }

    @Test
    fun `재가입 회원은 이전 계정의 정지가 살아 있으면 정지로 판정한다`() {
        // given
        val rejoined = saveMember("+821033334445", "구름빵둘", Gender.FEMALE)
        memberSuspensionRepository.saveAndFlush(
            MemberSuspension(
                phoneNumber = "+821033334445",
                memberId = rejoined.id - 1,
                nickname = "구름빵",
                type = SuspensionType.SERVICE,
                reason = SuspensionReason.ABUSE,
                startedAt = NOW.minusSeconds(3600),
                expiresAt = null,
            ),
        )
        entityManager.flush()
        entityManager.clear()

        // when
        val suspended = memberAdminRepository.findAllForAdmin("SUSPENDED", null, null, null, null, NOW, 20, 0)

        // then
        assertThat(suspended.map { it.id }).contains(rejoined.id)
        assertThat(suspended.first { it.id == rejoined.id }.suspended).isTrue()
    }

    @Test
    fun `상세 행은 탈퇴 회원도 준다`() {
        // given

        // when
        val row = memberAdminRepository.findRowById(withdrawnId)

        // then
        assertThat(row).isNotNull
        assertThat(row!!.nickname).isEqualTo("초록불")
        assertThat(row.withdrawnAt).isNotNull()
        assertThat(row.joinedAt).isNotNull()
    }

    @Test
    fun `닉네임 이력은 회원 것만 최신순으로 준다`() {
        // given
        nicknameHistoryAdminRepository.saveAllAndFlush(
            listOf(
                NicknameHistory(normalId, "밤산책"),
                NicknameHistory(normalId, "새벽별"),
                NicknameHistory(suspendedId, "구름빵"),
            ),
        )

        // when
        val histories = nicknameHistoryAdminRepository.findAllByMemberIdOrderByIdDesc(normalId)

        // then
        assertThat(histories.map { it.nickname }).containsExactly("새벽별", "밤산책")
    }

    private fun saveMember(phoneNumber: String, nickname: String, gender: Gender) =
        memberAdminRepository.saveAndFlush(
            Member(
                phoneNumber = phoneNumber,
                password = "encoded-password",
                gender = gender,
                nickname = nickname,
                birthYear = 1998,
            ),
        )

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-20T00:00:00Z")
    }
}
