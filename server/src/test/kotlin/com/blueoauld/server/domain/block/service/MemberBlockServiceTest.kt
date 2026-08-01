package com.blueoauld.server.domain.block.service

import com.blueoauld.server.domain.block.entity.MemberBlock
import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.service.MemberSummaryService
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

class MemberBlockServiceTest {

    private val memberBlockRepository = mockk<MemberBlockRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val memberSummaryService = mockk<MemberSummaryService>(relaxed = true)

    private val memberBlockService = MemberBlockService(
        memberBlockRepository,
        memberRepository,
        memberSummaryService,
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.existsById(BLOCKED_MEMBER_ID) } returns true
        every { memberBlockRepository.existsByBlockerIdAndBlockedMemberId(any(), any()) } returns false
        every { memberBlockRepository.saveAndFlush(any()) } answers { firstArg() }
    }

    @Test
    fun `차단하면 기록을 남긴다`() {
        // given
        val saved = slot<MemberBlock>()

        // when
        memberBlockService.block(BLOCKER_ID, BLOCKED_MEMBER_ID)

        // then
        verify { memberBlockRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.blockerId).isEqualTo(BLOCKER_ID)
        assertThat(saved.captured.blockedMemberId).isEqualTo(BLOCKED_MEMBER_ID)
    }

    @Test
    fun `이미 차단한 회원을 또 차단해도 기록이 늘지 않는다`() {
        // given
        every {
            memberBlockRepository.existsByBlockerIdAndBlockedMemberId(BLOCKER_ID, BLOCKED_MEMBER_ID)
        } returns true

        // when
        memberBlockService.block(BLOCKER_ID, BLOCKED_MEMBER_ID)

        // then
        verify(exactly = 0) { memberBlockRepository.saveAndFlush(any()) }
    }

    @Test
    fun `자기 자신은 차단할 수 없다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberBlockService.block(BLOCKER_ID, BLOCKER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_BLOCK)
        verify(exactly = 0) { memberBlockRepository.saveAndFlush(any()) }
    }

    @Test
    fun `없는 회원은 차단할 수 없다`() {
        // given
        every { memberRepository.existsById(BLOCKED_MEMBER_ID) } returns false

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberBlockService.block(BLOCKER_ID, BLOCKED_MEMBER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
        verify(exactly = 0) { memberBlockRepository.saveAndFlush(any()) }
    }

    @Test
    fun `차단을 해제하면 기록을 지운다`() {
        // given

        // when
        memberBlockService.unblock(BLOCKER_ID, BLOCKED_MEMBER_ID)

        // then
        verify { memberBlockRepository.deleteByBlockerIdAndBlockedMemberId(BLOCKER_ID, BLOCKED_MEMBER_ID) }
    }

    @Test
    fun `차단 목록을 커서 순서대로 준다`() {
        // given
        val blocks = listOf(block(30L, BLOCKED_MEMBER_ID), block(20L, 3L))
        every {
            memberBlockRepository.findByBlockerIdAndIdLessThanOrderByIdDesc(BLOCKER_ID, Long.MAX_VALUE, any())
        } returns blocks
        every { memberSummaryService.findSummaries(listOf(BLOCKED_MEMBER_ID, 3L)) } returns
                listOf(summary(BLOCKED_MEMBER_ID), summary(3L))

        // when
        val response = memberBlockService.findBlocked(BLOCKER_ID, null, 2)

        // then
        assertThat(response.items).extracting("memberId").containsExactly(BLOCKED_MEMBER_ID, 3L)
        assertThat(response.nextCursor).isEqualTo(20L)
    }

    private fun block(id: Long, blockedMemberId: Long) = mockk<MemberBlock>(relaxed = true) {
        every { this@mockk.id } returns id
        every { blockerId } returns BLOCKER_ID
        every { this@mockk.blockedMemberId } returns blockedMemberId
    }

    private fun summary(memberId: Long) = MemberSummaryResponse(
        memberId = memberId,
        nickname = "닉네임",
        gender = Gender.MALE,
        age = 28,
        receivedLikeCount = 0,
        comment = null,
        profileImageUrl = null,
    )

    companion object {

        private const val BLOCKER_ID = 1L
        private const val BLOCKED_MEMBER_ID = 2L
    }
}
