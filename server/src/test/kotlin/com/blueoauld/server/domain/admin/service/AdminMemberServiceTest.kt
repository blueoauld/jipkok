package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminMemberRow
import com.blueoauld.server.domain.admin.dto.AdminMemberStatus
import com.blueoauld.server.domain.admin.dto.AdminSuspensionStatus
import com.blueoauld.server.domain.admin.dto.request.ResetProfileRequest
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.member.repository.MemberAdminRepository
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.domain.member.service.MemberWithdrawService
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
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

    private val memberSuspensionRepository = mockk<MemberSuspensionRepository>()

    private val memberAdminService = mockk<MemberAdminService>()

    private val memberWithdrawService = mockk<MemberWithdrawService>()

    private val adminMemberService = AdminMemberService(
        memberAdminRepository,
        memberSuspensionRepository,
        memberAdminService,
        memberWithdrawService,
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
        val response = adminMemberService.findMembers(AdminMemberStatus.ALL, null, " 1000 ", 1, 20)

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
        adminMemberService.findMembers(AdminMemberStatus.ALL, null, null, 1, 20)
        val response = adminMemberService.findMembers(AdminMemberStatus.ALL, null, null, 1, 20)

        // then
        assertThat(response.totalCount).isEqualTo(63)
        verify(exactly = 1) { memberAdminRepository.countForAdmin(null, null, null, null, null, NOW) }
    }

    @Test
    fun `문자 검색어는 닉네임 조건으로 넘긴다`() {
        // given
        every {
            memberAdminRepository.findAllForAdmin("NORMAL", null, null, null, "%구름%", NOW, 20, 0)
        } returns emptyList()
        every { memberAdminRepository.countForAdmin("NORMAL", null, null, null, "%구름%", NOW) } returns 0

        // when
        val response = adminMemberService.findMembers(AdminMemberStatus.NORMAL, null, "구름", 1, 20)

        // then
        assertThat(response.page).isEqualTo(1)
    }

    @Test
    fun `상세는 사진 URL과 전화번호 기준 정지 이력을 합친다`() {
        // given
        every { memberAdminRepository.findRowById(MEMBER_ID) } returns row()
        every { memberAdminService.findPhotoUrls(MEMBER_ID, PhotoVisibility.PUBLIC) } returns listOf("public-1")
        every { memberAdminService.findPhotoUrls(MEMBER_ID, PhotoVisibility.SECRET) } returns listOf("secret-1")
        every { memberSuspensionRepository.findByPhoneNumberOrderByIdDesc("01011112222") } returns listOf(
            suspension(expiresAt = NOW.plusSeconds(3600)),
            suspension(expiresAt = NOW.minusSeconds(3600)),
            suspension(expiresAt = null, releasedAt = NOW.minusSeconds(60)),
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
    }

    @Test
    fun `프로필 초기화와 탈퇴는 기존 서비스에 위임한다`() {
        // given
        every { memberAdminService.resetProfile(MEMBER_ID, ProfileTarget.NICKNAME) } returns "새닉네임"
        justRun { memberWithdrawService.withdraw(MEMBER_ID) }

        // when
        adminMemberService.resetProfile(MEMBER_ID, ResetProfileRequest(target = ProfileTarget.NICKNAME))
        adminMemberService.withdraw(MEMBER_ID)

        // then
        verify { memberAdminService.resetProfile(MEMBER_ID, ProfileTarget.NICKNAME) }
        verify { memberWithdrawService.withdraw(MEMBER_ID) }
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
        override val phoneNumber = "01011112222"
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
            phoneNumber = "01011112222",
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

        private val NOW: Instant = Instant.parse("2026-08-20T06:00:00Z")
    }
}
