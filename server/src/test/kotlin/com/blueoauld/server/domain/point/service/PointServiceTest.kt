package com.blueoauld.server.domain.point.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
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
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

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
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member(100))
        every { memberRepository.addPointBalance(any(), any()) } returns 1
        every { pointHistoryRepository.save(any()) } answers { firstArg() }
        every {
            pointHistoryRepository.countByMemberIdAndTypeAndRecordedAtGreaterThanEqual(any(), any(), any())
        } returns 0
    }

    @Test
    fun `보상을 받으면 잔액이 늘고 내역이 남는다`() {
        // given
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
    fun `하루 한도를 채웠으면 지급하지 않는다`() {
        // given
        stubEarnedToday(PointType.ACCESS_REWARD, 1)

        // when
        val response = pointService.earn(MEMBER_ID, PointType.ACCESS_REWARD)

        // then
        assertThat(response.earned).isFalse()
        assertThat(response.amount).isZero()
        assertThat(response.balance).isEqualTo(100)
        verify(exactly = 0) { memberRepository.addPointBalance(any(), any()) }
        verify(exactly = 0) { pointHistoryRepository.save(any()) }
    }

    @Test
    fun `광고 보상은 하루 다섯 번까지 받는다`() {
        // given
        stubEarnedToday(PointType.AD_REWARD, 4)

        // when
        val response = pointService.earn(MEMBER_ID, PointType.AD_REWARD)

        // then
        assertThat(response.earned).isTrue()
    }

    @Test
    fun `광고 보상 다섯 번을 채우면 더 받지 못한다`() {
        // given
        stubEarnedToday(PointType.AD_REWARD, 5)

        // when
        val response = pointService.earn(MEMBER_ID, PointType.AD_REWARD)

        // then
        assertThat(response.earned).isFalse()
    }

    @Test
    fun `포인트를 쓰면 잔액이 줄고 내역이 남는다`() {
        // given
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
        every { memberRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            pointService.earn(MEMBER_ID, PointType.ACCESS_REWARD)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    private fun stubEarnedToday(type: PointType, count: Long) {
        every {
            pointHistoryRepository.countByMemberIdAndTypeAndRecordedAtGreaterThanEqual(MEMBER_ID, type, any())
        } returns count
    }

    private fun member(pointBalance: Int) = Member(
        phoneNumber = "01012345678",
        password = "encoded",
        gender = Gender.MALE,
        nickname = "닉네임",
        birthYear = 1998,
        pointBalance = pointBalance,
    )

    companion object {

        private const val MEMBER_ID = 0L
        private val NOW: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
