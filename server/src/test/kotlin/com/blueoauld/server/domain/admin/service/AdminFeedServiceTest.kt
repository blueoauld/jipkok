package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminFeedReportRow
import com.blueoauld.server.domain.admin.dto.MemberNickname
import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.feed.repository.FeedPostReportRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.Optional

class AdminFeedServiceTest {

    private val feedPostReportRepository = mockk<FeedPostReportRepository>()

    private val feedPostRepository = mockk<FeedPostRepository>()

    private val memberRepository = mockk<MemberRepository>()

    private val photoStorage = mockk<PhotoStorage>()

    private val adminFeedService = AdminFeedService(
        feedPostReportRepository,
        feedPostRepository,
        memberRepository,
        photoStorage,
    )

    @Test
    fun `목록은 닉네임과 사진 URL을 채운다`() {
        // given
        every { feedPostReportRepository.findAllForAdmin(null, null, 20, 0) } returns listOf(row())
        every { feedPostReportRepository.countForAdmin(null, null) } returns 1
        every { memberRepository.findNicknamesByIdIn(listOf(10L, 1L)) } returns listOf(
            memberNickname(10, "밤산책"),
        )
        every { photoStorage.toPublicUrl("feeds/1/photo.jpg") } returns "https://photo/feeds/1/photo.jpg"

        // when
        val response = adminFeedService.findReports(null, null, 1, 20)

        // then
        assertThat(response.totalCount).isEqualTo(1)
        assertThat(response.items.first().reporterNickname).isEqualTo("밤산책")
        assertThat(response.items.first().authorNickname).isEqualTo("알 수 없음")
        assertThat(response.items.first().thumbnailUrl).isEqualTo("https://photo/feeds/1/photo.jpg")
    }

    @Test
    fun `게시물 삭제는 소프트 삭제로 위임한다`() {
        // given
        val post = FeedPost(memberId = 1, slotAt = NOW, objectKey = "feeds/1/photo.jpg")
        every { feedPostRepository.findById(POST_ID) } returns Optional.of(post)
        justRun { feedPostRepository.delete(post) }

        // when
        adminFeedService.deletePost(POST_ID)

        // then
        verify { feedPostRepository.delete(post) }
    }

    @Test
    fun `없거나 이미 삭제된 게시물이면 예외를 던진다`() {
        // given
        every { feedPostRepository.findById(POST_ID) } returns Optional.empty()

        // when
        // then
        assertThatThrownBy { adminFeedService.deletePost(POST_ID) }
            .isInstanceOf(BusinessException::class.java)
            .extracting { (it as BusinessException).errorCode }
            .isEqualTo(ErrorCode.FEED_POST_NOT_FOUND)
    }

    private fun row() = object : AdminFeedReportRow {
        override val id = 2210L
        override val reporterId = 10L
        override val postId = POST_ID
        override val authorId = 1L
        override val objectKey = "feeds/1/photo.jpg"
        override val caption = "퇴근길 노을"
        override val postReportCount = 2L
        override val postDeletedAt = null
        override val createdAt: Instant = NOW
    }

    private fun memberNickname(id: Long, nickname: String) = object : MemberNickname {
        override val id = id
        override val nickname = nickname
    }

    companion object {

        private const val POST_ID = 8800L

        private val NOW: Instant = Instant.parse("2026-08-20T06:00:00Z")
    }
}
