package com.blueoauld.server.domain.point.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.entity.PointHistory
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.repository.PointHistoryRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import io.mockk.verifyOrder
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class PointServiceTest {

    private val pointHistoryRepository = mockk<PointHistoryRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val pointService = PointService(
        pointHistoryRepository,
        memberRepository,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.existsById(MEMBER_ID) } returns true
        every { memberRepository.addPointBalance(any(), any()) } returns 1
        every { pointHistoryRepository.save(any()) } answers { firstArg() }
    }

    @Test
    fun `보상을 받으면 잔액이 늘고 내역이 남는다`() {
        // given
        every { memberRepository.findPointBalance(MEMBER_ID) } returns 130
        val history = slot<PointHistory>()

        // when
        val response = pointService.earn(MEMBER_ID, PointType.ACCESS_REWARD)

        // then
        verify { memberRepository.addPointBalance(MEMBER_ID, 30) }
        verify { pointHistoryRepository.save(capture(history)) }
        assertThat(response.earned).isTrue()
        assertThat(response.amount).isEqualTo(30)
        assertThat(response.balance).isEqualTo(130)
        assertThat(history.captured.type).isEqualTo(PointType.ACCESS_REWARD)
        assertThat(history.captured.balanceAfter).isEqualTo(130)
        assertThat(history.captured.recordedAt).isEqualTo(NOW)
    }

    @Test
    fun `내역의 잔액은 갱신 뒤 다시 읽은 값이다`() {
        // given
        every { memberRepository.findPointBalance(MEMBER_ID) } returns 999

        // when
        val response = pointService.earn(MEMBER_ID, PointType.ACCESS_REWARD)

        // then
        verifyOrder {
            memberRepository.addPointBalance(MEMBER_ID, 30)
            memberRepository.findPointBalance(MEMBER_ID)
        }
        assertThat(response.balance).isEqualTo(999)
    }

    @Test
    fun `포인트를 쓰면 잔액이 줄고 내역이 남는다`() {
        // given
        every { memberRepository.findPointBalance(MEMBER_ID) } returns 85
        val history = slot<PointHistory>()

        // when
        pointService.spend(MEMBER_ID, PointType.NOTE_SEND)

        // then
        verify { memberRepository.addPointBalance(MEMBER_ID, -15) }
        verify { pointHistoryRepository.save(capture(history)) }
        assertThat(history.captured.amount).isEqualTo(-15)
        assertThat(history.captured.balanceAfter).isEqualTo(85)
    }

    @Test
    fun `잔액이 부족하면 쓰지 못한다`() {
        // given
        every { memberRepository.addPointBalance(MEMBER_ID, -15) } returns 0

        // when
        val exception = assertThrows(BusinessException::class.java) {
            pointService.spend(MEMBER_ID, PointType.NOTE_SEND)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.NOT_ENOUGH_POINT)
        verify(exactly = 0) { pointHistoryRepository.save(any()) }
    }

    @Test
    fun `없는 회원이면 보상을 받을 수 없다`() {
        // given
        every { memberRepository.addPointBalance(MEMBER_ID, any()) } returns 0

        // when
        val exception = assertThrows(BusinessException::class.java) {
            pointService.earn(MEMBER_ID, PointType.ACCESS_REWARD)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    companion object {

        private const val MEMBER_ID = 0L
        private val NOW: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
