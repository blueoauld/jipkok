package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.entity.WorryPostLike
import com.blueoauld.server.domain.worry.repository.WorryPostLikeRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
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

class WorryPostLikeServiceTest {

    private val worryPostLikeRepository = mockk<WorryPostLikeRepository>(relaxed = true)

    private val worryPostRepository = mockk<WorryPostRepository>(relaxed = true)

    private val worryPostLikeService = WorryPostLikeService(worryPostLikeRepository, worryPostRepository)

    @BeforeEach
    fun setUp() {
        every { worryPostRepository.existsById(POST_ID) } returns true
        every { worryPostLikeRepository.existsByPostIdAndMemberId(any(), any()) } returns false
        every { worryPostLikeRepository.saveAndFlush(any()) } answers { firstArg() }
        every { worryPostLikeRepository.deleteByPostIdAndMemberId(any(), any()) } returns 1
    }

    @Test
    fun `공감하면 기록하고 개수를 올린다`() {
        // given
        val saved = slot<WorryPostLike>()

        // when
        worryPostLikeService.like(MEMBER_ID, POST_ID)

        // then
        verify { worryPostLikeRepository.saveAndFlush(capture(saved)) }
        verify { worryPostRepository.increaseLikeCount(POST_ID) }
        assertThat(saved.captured.postId).isEqualTo(POST_ID)
        assertThat(saved.captured.memberId).isEqualTo(MEMBER_ID)
    }

    @Test
    fun `이미 공감했으면 개수를 올리지 않는다`() {
        // given
        every { worryPostLikeRepository.existsByPostIdAndMemberId(POST_ID, MEMBER_ID) } returns true

        // when
        worryPostLikeService.like(MEMBER_ID, POST_ID)

        // then
        verify(exactly = 0) { worryPostLikeRepository.saveAndFlush(any()) }
        verify(exactly = 0) { worryPostRepository.increaseLikeCount(any()) }
    }

    @Test
    fun `없는 글이면 실패한다`() {
        // given
        every { worryPostRepository.existsById(POST_ID) } returns false

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryPostLikeService.like(MEMBER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.WORRY_POST_NOT_FOUND)
        verify(exactly = 0) { worryPostLikeRepository.saveAndFlush(any()) }
    }

    @Test
    fun `취소하면 기록을 지우고 개수를 내린다`() {
        // given

        // when
        worryPostLikeService.cancel(MEMBER_ID, POST_ID)

        // then
        verify { worryPostRepository.decreaseLikeCount(POST_ID) }
    }

    @Test
    fun `공감한 적이 없으면 개수를 내리지 않는다`() {
        // given
        every { worryPostLikeRepository.deleteByPostIdAndMemberId(POST_ID, MEMBER_ID) } returns 0

        // when
        worryPostLikeService.cancel(MEMBER_ID, POST_ID)

        // then
        verify(exactly = 0) { worryPostRepository.decreaseLikeCount(any()) }
    }

    companion object {

        private const val MEMBER_ID = 1L
        private const val POST_ID = 10L
    }
}
