package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminSuspensionStatus
import com.blueoauld.server.domain.admin.dto.request.CreateSuspensionRequest
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.SuspensionAdminRepository
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class AdminSuspensionServiceTest {

    private val suspensionAdminRepository = mockk<SuspensionAdminRepository>()

    private val memberSuspensionService = mockk<MemberSuspensionService>()

    private val adminActionRecorder = mockk<AdminActionRecorder>(relaxed = true)

    private val adminSuspensionService = AdminSuspensionService(
        suspensionAdminRepository,
        memberSuspensionService,
        adminActionRecorder,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `목록은 상태를 계산해서 준다`() {
        // given
        every {
            suspensionAdminRepository.findAllForAdmin(null, null, null, NOW, 20, 0)
        } returns listOf(
            suspension(expiresAt = NOW.plusSeconds(3600)),
            suspension(expiresAt = NOW.minusSeconds(3600)),
        )
        every { suspensionAdminRepository.countForAdmin(null, null, null, NOW) } returns 2

        // when
        val response = adminSuspensionService.findSuspensions(null, null, null, 1, 20)

        // then
        assertThat(response.totalCount).isEqualTo(2)
        assertThat(response.items.map { it.status }).containsExactly(
            AdminSuspensionStatus.ACTIVE,
            AdminSuspensionStatus.EXPIRED,
        )
    }

    @Test
    fun `정지는 기존 서비스에 위임하고 응답을 만든다`() {
        // given
        every {
            memberSuspensionService.suspend(MEMBER_ID, SuspensionType.SERVICE, SuspensionReason.ABUSE, 7, "상세")
        } returns suspension(NOW.plusSeconds(604_800))

        // when
        val response = adminSuspensionService.suspend(
            ACTOR_ID,
            CreateSuspensionRequest(
                memberId = MEMBER_ID,
                type = SuspensionType.SERVICE,
                reason = SuspensionReason.ABUSE,
                days = 7,
                detail = "상세",
            ),
        )

        // then
        assertThat(response.status).isEqualTo(AdminSuspensionStatus.ACTIVE)
        assertThat(response.memberId).isEqualTo(MEMBER_ID)
        verify {
            adminActionRecorder.record(ACTOR_ID, AdminActionType.SUSPEND, MEMBER_ID, "SERVICE ABUSE 7일")
        }
    }

    @Test
    fun `해제는 기존 서비스에 위임하고 정지 당시 회원을 대상으로 기록한다`() {
        // given
        every { memberSuspensionService.release(SUSPENSION_ID) } returns suspension(expiresAt = null)

        // when
        adminSuspensionService.release(ACTOR_ID, SUSPENSION_ID)

        // then
        verify {
            adminActionRecorder.record(ACTOR_ID, AdminActionType.RELEASE_SUSPENSION, MEMBER_ID, "SERVICE")
        }
    }

    @Test
    fun `응답에 상세 사유를 담는다`() {
        // given
        every {
            memberSuspensionService.suspend(MEMBER_ID, SuspensionType.SERVICE, SuspensionReason.ABUSE, null, "상세")
        } returns suspension(expiresAt = null, detail = "상세")

        // when
        val response = adminSuspensionService.suspend(
            ACTOR_ID,
            CreateSuspensionRequest(
                memberId = MEMBER_ID,
                type = SuspensionType.SERVICE,
                reason = SuspensionReason.ABUSE,
                detail = "상세",
            ),
        )

        // then
        assertThat(response.detail).isEqualTo("상세")
    }

    private fun suspension(expiresAt: Instant?, detail: String? = null) = MemberSuspension(
        phoneNumber = "+821011112222",
        memberId = MEMBER_ID,
        nickname = "밤산책",
        type = SuspensionType.SERVICE,
        reason = SuspensionReason.ABUSE,
        startedAt = NOW.minusSeconds(7200),
        expiresAt = expiresAt,
        detail = detail,
    )

    companion object {

        private const val MEMBER_ID = 1000L
        private const val ACTOR_ID = 7L
        private const val SUSPENSION_ID = 10L

        private val NOW: Instant = Instant.parse("2026-08-20T06:00:00Z")
    }
}
