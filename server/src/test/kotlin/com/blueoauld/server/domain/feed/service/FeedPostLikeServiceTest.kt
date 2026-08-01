package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.entity.FeedPostLike
import com.blueoauld.server.domain.feed.repository.FeedPostLikeRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
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

class FeedPostLikeServiceTest {

    private val feedPostLikeRepository = mockk<FeedPostLikeRepository>(relaxed = true)

    private val feedPostRepository = mockk<FeedPostRepository>(relaxed = true)

    private val feedPostLikeService = FeedPostLikeService(feedPostLikeRepository, feedPostRepository)

    @BeforeEach
    fun setUp() {
        every { feedPostRepository.existsById(POST_ID) } returns true
        every { feedPostLikeRepository.existsByPostIdAndMemberId(any(), any()) } returns false
        every { feedPostLikeRepository.saveAndFlush(any()) } answers { firstArg() }
        every { feedPostLikeRepository.deleteByPostIdAndMemberId(any(), any()) } returns 1
    }

    @Test
    fun `좋아요를 누르면 기록하고 개수를 올린다`() {
        // given
        val saved = slot<FeedPostLike>()

        // when
        feedPostLikeService.like(MEMBER_ID, POST_ID)

        // then
        verify { feedPostLikeRepository.saveAndFlush(capture(saved)) }
        verify { feedPostRepository.increaseLikeCount(POST_ID) }
        assertThat(saved.captured.postId).isEqualTo(POST_ID)
        assertThat(saved.captured.memberId).isEqualTo(MEMBER_ID)
    }

    @Test
    fun `이미 눌렀으면 개수를 올리지 않는다`() {
        // given
        every { feedPostLikeRepository.existsByPostIdAndMemberId(POST_ID, MEMBER_ID) } returns true

        // when
        feedPostLikeService.like(MEMBER_ID, POST_ID)

        // then
        verify(exactly = 0) { feedPostLikeRepository.saveAndFlush(any()) }
        verify(exactly = 0) { feedPostRepository.increaseLikeCount(any()) }
    }

    @Test
    fun `없는 게시물이면 실패한다`() {
        // given
        every { feedPostRepository.existsById(POST_ID) } returns false

        // when
        val exception = assertThrows(BusinessException::class.java) {
            feedPostLikeService.like(MEMBER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.FEED_POST_NOT_FOUND)
        verify(exactly = 0) { feedPostLikeRepository.saveAndFlush(any()) }
    }

    @Test
    fun `취소하면 기록을 지우고 개수를 내린다`() {
        // given

        // when
        feedPostLikeService.cancel(MEMBER_ID, POST_ID)

        // then
        verify { feedPostRepository.decreaseLikeCount(POST_ID) }
    }

    @Test
    fun `누른 적이 없으면 개수를 내리지 않는다`() {
        // given
        every { feedPostLikeRepository.deleteByPostIdAndMemberId(POST_ID, MEMBER_ID) } returns 0

        // when
        feedPostLikeService.cancel(MEMBER_ID, POST_ID)

        // then
        verify(exactly = 0) { feedPostRepository.decreaseLikeCount(any()) }
    }

    companion object {

        private const val MEMBER_ID = 1L
        private const val POST_ID = 10L
    }
}
