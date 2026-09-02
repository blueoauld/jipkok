package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.dto.projection.FeedPostRow
import com.blueoauld.server.domain.feed.dto.request.CreateFeedPostRequest
import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.feed.entity.type.FeedSort
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.domain.photo.dto.request.CreatePhotoUploadUrlRequest
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.photo.service.PhotoUploadService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
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
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.*

class FeedPostServiceTest {

    private val feedPostRepository = mockk<FeedPostRepository>(relaxed = true)

    private val photoUploadService = mockk<PhotoUploadService>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val feedPostService = FeedPostService(
        feedPostRepository,
        photoUploadService,
        photoStorage,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { feedPostRepository.existsByMemberIdAndSlotAt(any(), any()) } returns false
        every { feedPostRepository.saveAndFlush(any()) } answers { firstArg() }
    }

    @Test
    fun `날짜를 생략하면 한국 시간 오늘 하루를 조회한다`() {
        // given
        val from = slot<Instant>()
        val to = slot<Instant>()
        every {
            feedPostRepository.findByDateLatestFirst(any(), any(), capture(from), capture(to), any(), any())
        } returns emptyList()

        // when
        feedPostService.findByDate(MEMBER_ID, null, FeedSort.LATEST, null, null, 20)

        // then
        assertThat(from.captured).isEqualTo(Instant.parse("2026-08-01T15:00:00Z"))
        assertThat(to.captured).isEqualTo(Instant.parse("2026-08-02T15:00:00Z"))
    }

    @Test
    fun `목록은 행의 닉네임을 그대로 싣고 페이지가 차면 다음 커서를 준다`() {
        // given
        every {
            feedPostRepository.findByDateLatestFirst(any(), any(), any(), any(), any(), any())
        } returns listOf(row(1L), row(2L))
        every { photoStorage.toPublicUrl("feeds/1/a.webp") } returns "https://cdn/a.webp"

        // when
        val response = feedPostService.findByDate(MEMBER_ID, null, FeedSort.LATEST, null, null, 2)

        // then
        assertThat(response.items.map { it.postId }).containsExactly(1L, 2L)
        assertThat(response.items.map { it.nickname }).containsExactly("회원1", "회원2")
        assertThat(response.items.first().imageUrl).isEqualTo("https://cdn/a.webp")
        assertThat(response.nextCursor).isEqualTo(2L)
    }

    @Test
    fun `페이지가 덜 차면 다음 커서가 없다`() {
        // given
        every {
            feedPostRepository.findByDateLatestFirst(any(), any(), any(), any(), any(), any())
        } returns listOf(row(1L))

        // when
        val response = feedPostService.findByDate(MEMBER_ID, null, FeedSort.LATEST, null, null, 20)

        // then
        assertThat(response.nextCursor).isNull()
    }

    @Test
    fun `과거 정렬은 다른 쿼리로 찾는다`() {
        // given
        every {
            feedPostRepository.findByDateOldestFirst(any(), any(), any(), any(), any(), any())
        } returns emptyList()

        // when
        feedPostService.findByDate(MEMBER_ID, null, FeedSort.OLDEST, LocalDate.of(2026, 8, 1), null, 20)

        // then
        verify { feedPostRepository.findByDateOldestFirst(any(), any(), any(), any(), any(), any()) }
        verify(exactly = 0) { feedPostRepository.findByDateLatestFirst(any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `게시물을 정각 시간대로 저장한다`() {
        // given
        val saved = slot<FeedPost>()

        // when
        feedPostService.create(MEMBER_ID, CreateFeedPostRequest(photoKey(), "점심"))

        // then
        verify { feedPostRepository.saveAndFlush(capture(saved)) }
        verify { photoUploadService.confirm(listOf(photoKey())) }
        assertThat(saved.captured.slotAt).isEqualTo(Instant.parse("2026-08-02T05:00:00Z"))
        assertThat(saved.captured.objectKey).isEqualTo(photoKey())
        assertThat(saved.captured.caption).isEqualTo("점심")
    }

    @Test
    fun `문구가 비어 있으면 저장하지 않는다`() {
        // given
        val saved = slot<FeedPost>()

        // when
        feedPostService.create(MEMBER_ID, CreateFeedPostRequest(photoKey(), ""))

        // then
        verify { feedPostRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.caption).isNull()
    }

    @Test
    fun `같은 시간대에 이미 올렸으면 실패한다`() {
        // given
        every { feedPostRepository.existsByMemberIdAndSlotAt(MEMBER_ID, any()) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            feedPostService.create(MEMBER_ID, CreateFeedPostRequest(photoKey()))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DUPLICATE_FEED_POST)
        verify(exactly = 0) { feedPostRepository.saveAndFlush(any()) }
    }

    @Test
    fun `남의 사진 키를 보내면 실패한다`() {
        // given
        // when
        val exception = assertThrows(BusinessException::class.java) {
            feedPostService.create(MEMBER_ID, CreateFeedPostRequest("feeds/999/other.jpg"))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { feedPostRepository.saveAndFlush(any()) }
    }

    @Test
    fun `관리자 삭제는 게시물을 소프트 삭제한다`() {
        // given
        val post = FeedPost(memberId = MEMBER_ID, slotAt = NOW, objectKey = photoKey())
        every { feedPostRepository.findById(POST_ID) } returns Optional.of(post)

        // when
        feedPostService.deleteByAdmin(POST_ID)

        // then
        verify { feedPostRepository.delete(post) }
    }

    @Test
    fun `없는 게시물은 관리자도 지울 수 없다`() {
        // given
        every { feedPostRepository.findById(POST_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            feedPostService.deleteByAdmin(POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.FEED_POST_NOT_FOUND)
    }

    @Test
    fun `업로드 URL은 피드 폴더 아래로 발급한다`() {
        // given
        val prefix = slot<String>()
        every { photoUploadService.createUploadUrl(any(), capture(prefix), any()) } returns
            PhotoUploadUrlResponse("https://upload.test/key", "feeds/$MEMBER_ID/key.jpg")

        // when
        val response = feedPostService.createPhotoUploadUrl(
            MEMBER_ID,
            CreatePhotoUploadUrlRequest("image/jpeg"),
        )

        // then
        assertThat(prefix.captured).isEqualTo("feeds/$MEMBER_ID/")
        assertThat(response.objectKey).isEqualTo("feeds/$MEMBER_ID/key.jpg")
    }

    private fun photoKey() = "feeds/$MEMBER_ID/photo.jpg"

    private fun row(postId: Long) = mockk<FeedPostRow> {
        every { getPostId() } returns postId
        every { getMemberId() } returns postId
        every { getNickname() } returns "회원$postId"
        every { getSlotAt() } returns NOW
        every { getCaption() } returns null
        every { getObjectKey() } returns "feeds/$postId/a.webp"
        every { getLikedByMe() } returns false
    }

    companion object {

        private const val MEMBER_ID = 1L
        private const val POST_ID = 10L

        private val NOW: Instant = Instant.parse("2026-08-02T05:37:12Z")
    }
}
