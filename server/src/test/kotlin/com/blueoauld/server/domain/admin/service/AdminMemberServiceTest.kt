package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminMemberStatus
import com.blueoauld.server.domain.admin.dto.AdminSuspensionStatus
import com.blueoauld.server.domain.admin.dto.projection.AdminMemberRow
import com.blueoauld.server.domain.admin.dto.request.ResetProfileRequest
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.MemberAdminRepository
import com.blueoauld.server.domain.admin.repository.NicknameHistoryAdminRepository
import com.blueoauld.server.domain.admin.repository.SuspensionAdminRepository
import com.blueoauld.server.domain.member.entity.NicknameHistory
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.domain.member.service.MemberWithdrawService
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class AdminMemberServiceTest {

    private val memberAdminRepository = mockk<MemberAdminRepository>()

    private val suspensionAdminRepository = mockk<SuspensionAdminRepository>()

    private val nicknameHistoryAdminRepository = mockk<NicknameHistoryAdminRepository>()

    private val memberAdminService = mockk<MemberAdminService>()

    private val memberWithdrawService = mockk<MemberWithdrawService>()

    private val adminActionRecorder = mockk<AdminActionRecorder>(relaxed = true)

    private val adminMemberService = AdminMemberService(
        memberAdminRepository,
        suspensionAdminRepository,
        nicknameHistoryAdminRepository,
        memberAdminService,
        memberWithdrawService,
        adminActionRecorder,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `숫자 검색어는 ID와 전화번호 조건으로 넘긴다`() {
        // given
        every {
            memberAdminRepository.findAllForAdmin(null, null, 1000, "%1000%", null, NOW, 20, 0)
        } returns emptyList()
        every { memberAdminRepository.countForAdmin(null, null, 1000, "%1000%", null, NOW) } returns 0

        // when
        val response = adminMemberService.findMembers(null, null, " 1000 ", 1, 20)

        // then
        assertThat(response.totalCount).isZero()
    }

    @Test
    fun `필터가 없는 총 건수는 캐시한다`() {
        // given
        every {
            memberAdminRepository.findAllForAdmin(null, null, null, null, null, NOW, 20, 0)
        } returns emptyList()
        every { memberAdminRepository.countForAdmin(null, null, null, null, null, NOW) } returns 63

        // when
        adminMemberService.findMembers(null, null, null, 1, 20)
        val response = adminMemberService.findMembers(null, null, null, 1, 20)

        // then
        assertThat(response.totalCount).isEqualTo(63)
        verify(exactly = 1) { memberAdminRepository.countForAdmin(null, null, null, null, null, NOW) }
    }

    @Test
    fun `국제 표기 전화번호는 +를 떼고 전화번호 조건으로만 넘긴다`() {
        // given
        every {
            memberAdminRepository.findAllForAdmin(null, null, 0, "%821033334444%", null, NOW, 20, 0)
        } returns emptyList()
        every { memberAdminRepository.countForAdmin(null, null, 0, "%821033334444%", null, NOW) } returns 0

        // when
        val response = adminMemberService.findMembers(null, null, " +821033334444 ", 1, 20)

        // then
        assertThat(response.totalCount).isZero()
    }

    @Test
    fun `하이픈이 든 국내 표기 전화번호는 하이픈과 앞의 0을 떼고 넘긴다`() {
        // given
        every {
            memberAdminRepository.findAllForAdmin(null, null, 0, "%1033334444%", null, NOW, 20, 0)
        } returns emptyList()
        every { memberAdminRepository.countForAdmin(null, null, 0, "%1033334444%", null, NOW) } returns 0

        // when
        val response = adminMemberService.findMembers(null, null, "010-3333-4444", 1, 20)

        // then
        assertThat(response.totalCount).isZero()
    }

    @Test
    fun `숫자만 있는 국내 표기 번호는 ID로도 찾고 전화번호는 앞의 0을 떼고 넘긴다`() {
        // given
        every {
            memberAdminRepository.findAllForAdmin(null, null, 1033334444, "%1033334444%", null, NOW, 20, 0)
        } returns emptyList()
        every {
            memberAdminRepository.countForAdmin(null, null, 1033334444, "%1033334444%", null, NOW)
        } returns 0

        // when
        val response = adminMemberService.findMembers(null, null, "01033334444", 1, 20)

        // then
        assertThat(response.totalCount).isZero()
    }

    @Test
    fun `문자 검색어는 와일드카드를 이스케이프해 닉네임 조건으로 넘긴다`() {
        // given
        every {
            memberAdminRepository.findAllForAdmin("NORMAL", null, null, null, """%구름\%\_%""", NOW, 20, 0)
        } returns emptyList()
        every {
            memberAdminRepository.countForAdmin("NORMAL", null, null, null, """%구름\%\_%""", NOW)
        } returns 0

        // when
        val response = adminMemberService.findMembers(AdminMemberStatus.NORMAL, null, "구름%_", 1, 20)

        // then
        assertThat(response.page).isEqualTo(1)
    }

    @Test
    fun `페이지가 아무리 커도 오프셋이 넘치지 않는다`() {
        // given
        every {
            memberAdminRepository.findAllForAdmin(
                null,
                null,
                null,
                null,
                null,
                NOW,
                100,
                (AdminPaging.MAX_PAGE - 1) * 100,
            )
        } returns emptyList()
        every { memberAdminRepository.countForAdmin(null, null, null, null, null, NOW) } returns 0

        // when
        val response = adminMemberService.findMembers(null, null, null, Int.MAX_VALUE, 500)

        // then
        assertThat(response.page).isEqualTo(AdminPaging.MAX_PAGE)
        assertThat(response.size).isEqualTo(100)
    }

    @Test
    fun `상세는 사진 URL, 전화번호 기준 정지 이력, 닉네임 이력을 합친다`() {
        // given
        every { memberAdminRepository.findRowById(MEMBER_ID) } returns row()
        every { memberAdminService.findPhotoUrls(MEMBER_ID) } returns mapOf(
            PhotoVisibility.PUBLIC to listOf("public-1"),
            PhotoVisibility.SECRET to listOf("secret-1"),
        )
        every { suspensionAdminRepository.findByPhoneNumberOrderByIdDesc("+821011112222") } returns listOf(
            suspension(expiresAt = NOW.plusSeconds(3600)),
            suspension(expiresAt = NOW.minusSeconds(3600)),
            suspension(expiresAt = null, releasedAt = NOW.minusSeconds(60)),
        )
        every { nicknameHistoryAdminRepository.findAllByMemberIdOrderByIdDesc(MEMBER_ID) } returns listOf(
            NicknameHistory(MEMBER_ID, "밤산책"),
            NicknameHistory(MEMBER_ID, "새벽별"),
        )

        // when
        val detail = adminMemberService.findDetail(MEMBER_ID)

        // then
        assertThat(detail.age).isEqualTo(28)
        assertThat(detail.publicPhotoUrls).containsExactly("public-1")
        assertThat(detail.secretPhotoUrls).containsExactly("secret-1")
        assertThat(detail.suspensions.map { it.status }).containsExactly(
            AdminSuspensionStatus.ACTIVE,
            AdminSuspensionStatus.EXPIRED,
            AdminSuspensionStatus.RELEASED,
        )
        assertThat(detail.nicknameHistories.map { it.nickname }).containsExactly("밤산책", "새벽별")
    }

    @Test
    fun `프로필 초기화와 탈퇴는 기존 서비스에 위임한다`() {
        // given
        justRun { memberAdminService.resetProfile(MEMBER_ID, ProfileTarget.NICKNAME) }
        justRun { memberWithdrawService.withdraw(MEMBER_ID) }

        // when
        adminMemberService.resetProfile(ACTOR_ID, MEMBER_ID, ResetProfileRequest(target = ProfileTarget.NICKNAME))
        adminMemberService.withdraw(ACTOR_ID, MEMBER_ID)

        // then
        verify { memberAdminService.resetProfile(MEMBER_ID, ProfileTarget.NICKNAME) }
        verify { memberWithdrawService.withdraw(MEMBER_ID) }
        verify {
            adminActionRecorder.record(ACTOR_ID, AdminActionType.RESET_PROFILE, MEMBER_ID, "NICKNAME")
        }
        verify { adminActionRecorder.record(ACTOR_ID, AdminActionType.WITHDRAW_MEMBER, MEMBER_ID) }
    }

    @Test
    fun `회원이 없으면 예외를 던진다`() {
        // given
        every { memberAdminRepository.findRowById(MEMBER_ID) } returns null

        // when
        // then
        assertThatThrownBy { adminMemberService.findDetail(MEMBER_ID) }
            .isInstanceOf(BusinessException::class.java)
            .extracting { (it as BusinessException).errorCode }
            .isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    private fun row() = object : AdminMemberRow {
        override val id = MEMBER_ID
        override val nickname = "밤산책"
        override val phoneNumber = "+821011112222"
        override val gender = "MALE"
        override val birthYear = 1998
        override val comment = null
        override val bio = null
        override val receivedLikeCount = 10
        override val pointBalance = 300
        override val noteReceiveEnabled = true
        override val latitude = null
        override val longitude = null
        override val locatedAt = null
        override val joinedAt: Instant = NOW.minusSeconds(86_400)
        override val withdrawnAt = null
    }

    private fun suspension(expiresAt: Instant?, releasedAt: Instant? = null): MemberSuspension {
        val suspension = MemberSuspension(
            phoneNumber = "+821011112222",
            memberId = MEMBER_ID,
            nickname = "밤산책",
            type = SuspensionType.SERVICE,
            reason = SuspensionReason.ABUSE,
            startedAt = NOW.minusSeconds(7200),
            expiresAt = expiresAt,
        )
        suspension.releasedAt = releasedAt
        return suspension
    }

    companion object {

        private const val MEMBER_ID = 1000L
        private const val ACTOR_ID = 7L

        private val NOW: Instant = Instant.parse("2026-08-20T06:00:00Z")
    }
}
