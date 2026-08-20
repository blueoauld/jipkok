package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminSuspensionStatus
import com.blueoauld.server.domain.admin.dto.request.CreateSuspensionRequest
import com.blueoauld.server.domain.admin.dto.request.ReleaseSuspensionRequest
import com.blueoauld.server.domain.suspension.dto.response.SuspensionDetail
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
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

    private val memberSuspensionRepository = mockk<MemberSuspensionRepository>()

    private val memberSuspensionService = mockk<MemberSuspensionService>()

    private val adminSuspensionService = AdminSuspensionService(
        memberSuspensionRepository,
        memberSuspensionService,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `목록은 상태를 계산해서 준다`() {
        // given
        every {
            memberSuspensionRepository.findAllForAdmin(null, null, null, NOW, 20, 0)
        } returns listOf(
            suspension(expiresAt = NOW.plusSeconds(3600)),
            suspension(expiresAt = NOW.minusSeconds(3600)),
        )
        every { memberSuspensionRepository.countForAdmin(null, null, null, NOW) } returns 2

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
        } returns detail()

        // when
        val response = adminSuspensionService.suspend(
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
    }

    @Test
    fun `해제는 기존 서비스에 위임한다`() {
        // given
        every { memberSuspensionService.release(MEMBER_ID, SuspensionType.SERVICE) } returns emptyList()

        // when
        adminSuspensionService.release(
            ReleaseSuspensionRequest(memberId = MEMBER_ID, type = SuspensionType.SERVICE),
        )

        // then
        verify { memberSuspensionService.release(MEMBER_ID, SuspensionType.SERVICE) }
    }

    private fun suspension(expiresAt: Instant?) = MemberSuspension(
        phoneNumber = "01011112222",
        memberId = MEMBER_ID,
        nickname = "밤산책",
        type = SuspensionType.SERVICE,
        reason = SuspensionReason.ABUSE,
        startedAt = NOW.minusSeconds(7200),
        expiresAt = expiresAt,
    )

    private fun detail() = SuspensionDetail.of(suspension(NOW.plusSeconds(604_800)), withdrawn = false)

    companion object {

        private const val MEMBER_ID = 1000L

        private val NOW: Instant = Instant.parse("2026-08-20T06:00:00Z")
    }
}
