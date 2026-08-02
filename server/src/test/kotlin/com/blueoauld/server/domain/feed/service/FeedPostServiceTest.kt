package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.dto.request.CreateFeedPhotoUploadUrlRequest
import com.blueoauld.server.domain.feed.dto.request.CreateFeedPostRequest
import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.dto.IssuedPhotoUpload
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
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

class FeedPostServiceTest {

    private val feedPostRepository = mockk<FeedPostRepository>(relaxed = true)

    private val photoUploadService = mockk<PhotoUploadService>(relaxed = true)

    private val memberSummaryService = mockk<MemberSummaryService>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val feedPostService = FeedPostService(
        feedPostRepository,
        photoUploadService,
        memberSummaryService,
        photoStorage,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { feedPostRepository.existsByMemberIdAndSlotAt(any(), any()) } returns false
        every { feedPostRepository.saveAndFlush(any()) } answers { firstArg() }
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
    fun `업로드 URL은 피드 폴더 아래로 발급한다`() {
        // given
        val prefix = slot<String>()
        every { photoUploadService.createUploadUrl(any(), capture(prefix), any()) } returns
                IssuedPhotoUpload("https://upload.test/key", "feeds/$MEMBER_ID/key.jpg")

        // when
        val response = feedPostService.createPhotoUploadUrl(
            MEMBER_ID,
            CreateFeedPhotoUploadUrlRequest("image/jpeg"),
        )

        // then
        assertThat(prefix.captured).isEqualTo("feeds/$MEMBER_ID/")
        assertThat(response.objectKey).isEqualTo("feeds/$MEMBER_ID/key.jpg")
    }

    private fun photoKey() = "feeds/$MEMBER_ID/photo.jpg"

    companion object {

        private const val MEMBER_ID = 1L

        private val NOW: Instant = Instant.parse("2026-08-02T05:37:12Z")
    }
}
