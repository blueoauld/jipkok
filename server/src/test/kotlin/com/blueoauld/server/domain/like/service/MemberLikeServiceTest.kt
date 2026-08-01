package com.blueoauld.server.domain.like.service

import com.blueoauld.server.domain.like.entity.MemberLike
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
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

class MemberLikeServiceTest {

    private val memberLikeRepository = mockk<MemberLikeRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val memberLikeService = MemberLikeService(memberLikeRepository, memberRepository)

    @BeforeEach
    fun setUp() {
        every { memberRepository.existsById(LIKED_MEMBER_ID) } returns true
        every { memberLikeRepository.existsByLikerIdAndLikedMemberId(any(), any()) } returns false
        every { memberLikeRepository.saveAndFlush(any()) } answers { firstArg() }
        every { memberLikeRepository.deleteByLikerIdAndLikedMemberId(any(), any()) } returns 1
    }

    @Test
    fun `좋아요를 누르면 기록을 남기고 받은 개수를 늘린다`() {
        // given
        val saved = slot<MemberLike>()

        // when
        memberLikeService.like(LIKER_ID, LIKED_MEMBER_ID)

        // then
        verify { memberLikeRepository.saveAndFlush(capture(saved)) }
        verify { memberRepository.increaseReceivedLikeCount(LIKED_MEMBER_ID) }
        assertThat(saved.captured.likerId).isEqualTo(LIKER_ID)
        assertThat(saved.captured.likedMemberId).isEqualTo(LIKED_MEMBER_ID)
    }

    @Test
    fun `이미 누른 좋아요를 또 눌러도 개수가 늘지 않는다`() {
        // given
        every { memberLikeRepository.existsByLikerIdAndLikedMemberId(LIKER_ID, LIKED_MEMBER_ID) } returns true

        // when
        memberLikeService.like(LIKER_ID, LIKED_MEMBER_ID)

        // then
        verify(exactly = 0) { memberLikeRepository.saveAndFlush(any()) }
        verify(exactly = 0) { memberRepository.increaseReceivedLikeCount(any()) }
    }

    @Test
    fun `자기 자신에게는 좋아요를 누를 수 없다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberLikeService.like(LIKER_ID, LIKER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_LIKE)
        verify(exactly = 0) { memberLikeRepository.saveAndFlush(any()) }
    }

    @Test
    fun `없는 회원에게는 좋아요를 누를 수 없다`() {
        // given
        every { memberRepository.existsById(LIKED_MEMBER_ID) } returns false

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberLikeService.like(LIKER_ID, LIKED_MEMBER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
        verify(exactly = 0) { memberLikeRepository.saveAndFlush(any()) }
    }

    @Test
    fun `좋아요를 취소하면 기록을 지우고 받은 개수를 줄인다`() {
        // given

        // when
        memberLikeService.cancel(LIKER_ID, LIKED_MEMBER_ID)

        // then
        verify { memberLikeRepository.deleteByLikerIdAndLikedMemberId(LIKER_ID, LIKED_MEMBER_ID) }
        verify { memberRepository.decreaseReceivedLikeCount(LIKED_MEMBER_ID) }
    }

    @Test
    fun `누르지 않은 좋아요를 취소해도 개수가 줄지 않는다`() {
        // given
        every { memberLikeRepository.deleteByLikerIdAndLikedMemberId(LIKER_ID, LIKED_MEMBER_ID) } returns 0

        // when
        memberLikeService.cancel(LIKER_ID, LIKED_MEMBER_ID)

        // then
        verify(exactly = 0) { memberRepository.decreaseReceivedLikeCount(any()) }
    }

    companion object {

        private const val LIKER_ID = 1L
        private const val LIKED_MEMBER_ID = 2L
    }
}
