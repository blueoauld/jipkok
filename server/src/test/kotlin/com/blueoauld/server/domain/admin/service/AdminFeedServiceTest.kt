package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminFeedPostRow
import com.blueoauld.server.domain.admin.dto.AdminFeedReporterRow
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
    fun `목록은 피드 단위로 신고자 목록과 닉네임, 사진 URL을 채운다`() {
        // given
        every { feedPostReportRepository.findPostsForAdmin(null, null, 20, 0) } returns listOf(postRow())
        every { feedPostReportRepository.countPostsForAdmin(null, null) } returns 1
        every { feedPostReportRepository.findReportersByPostIdIn(listOf(POST_ID)) } returns listOf(
            reporterRow(11),
            reporterRow(10),
        )
        every { memberRepository.findNicknamesByIdIn(listOf(1L, 11L, 10L)) } returns listOf(
            memberNickname(10, "밤산책"),
        )
        every { photoStorage.toPublicUrl("feeds/1/photo.jpg") } returns "https://photo/feeds/1/photo.jpg"

        // when
        val response = adminFeedService.findReports(null, null, 1, 20)

        // then
        val item = response.items.first()
        assertThat(response.totalCount).isEqualTo(1)
        assertThat(item.authorNickname).isEqualTo("알 수 없음")
        assertThat(item.thumbnailUrl).isEqualTo("https://photo/feeds/1/photo.jpg")
        assertThat(item.reportCount).isEqualTo(2)
        assertThat(item.reporters.map { it.nickname }).containsExactly("알 수 없음", "밤산책")
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

    private fun postRow() = object : AdminFeedPostRow {
        override val postId = POST_ID
        override val authorId = 1L
        override val objectKey = "feeds/1/photo.jpg"
        override val caption = "퇴근길 노을"
        override val reportCount = 2L
        override val postDeletedAt = null
        override val lastReportedAt: Instant = NOW
    }

    private fun reporterRow(reporterId: Long) = object : AdminFeedReporterRow {
        override val postId = POST_ID
        override val reporterId = reporterId
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
