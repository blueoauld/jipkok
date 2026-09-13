package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.response.ProfilePhotoResponse
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.photo.event.PhotosDeletedEvent
import com.blueoauld.server.domain.photo.service.PhotoUploadService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.tuple
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher

class MemberPhotoServiceTest {

    private val memberPhotoRepository = mockk<MemberPhotoRepository>(relaxed = true)

    private val photoUploadService = mockk<PhotoUploadService>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val memberPhotoService = MemberPhotoService(
        memberPhotoRepository,
        photoUploadService,
        photoStorage,
        eventPublisher,
    )

    @BeforeEach
    fun setUp() {
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns emptyList()
    }

    @Test
    fun `공개 사진과 비밀 사진을 보낸 순서대로 저장한다`() {
        // given
        val saved = slot<List<MemberPhoto>>()

        // when
        memberPhotoService.replace(
            MEMBER_ID,
            listOf(photoKey("a"), photoKey("b")),
            listOf(photoKey("c", PhotoVisibility.SECRET)),
        )

        // then
        verify { memberPhotoRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { memberPhotoRepository.saveAll(capture(saved)) }
        assertThat(saved.captured).extracting("visibility", "displayOrder", "objectKey")
            .containsExactly(
                tuple(PhotoVisibility.PUBLIC, 0, photoKey("a")),
                tuple(PhotoVisibility.PUBLIC, 1, photoKey("b")),
                tuple(PhotoVisibility.SECRET, 0, photoKey("c", PhotoVisibility.SECRET)),
            )
    }

    @Test
    fun `사진을 비우면 기존 사진만 지운다`() {
        // given
        val saved = slot<List<MemberPhoto>>()

        // when
        memberPhotoService.replace(MEMBER_ID, emptyList(), emptyList())

        // then
        verify { memberPhotoRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { memberPhotoRepository.saveAll(capture(saved)) }
        assertThat(saved.captured).isEmpty()
    }

    @Test
    fun `남의 사진 키를 보내면 실패한다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberPhotoService.replace(MEMBER_ID, listOf("members/999/public/other.jpg"), emptyList())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { memberPhotoRepository.saveAll(any<List<MemberPhoto>>()) }
    }

    @Test
    fun `같은 사진 키를 두 번 보내면 실패한다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberPhotoService.replace(MEMBER_ID, listOf(photoKey("a"), photoKey("a")), emptyList())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { memberPhotoRepository.saveAll(any<List<MemberPhoto>>()) }
    }

    @Test
    fun `비밀 사진 키를 공개 사진으로 보내면 실패한다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberPhotoService.replace(MEMBER_ID, listOf(photoKey("a", PhotoVisibility.SECRET)), emptyList())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { memberPhotoRepository.saveAll(any<List<MemberPhoto>>()) }
    }

    @Test
    fun `빠진 사진은 삭제 이벤트를 발행한다`() {
        // given
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns listOf(
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 0, photoKey("a")),
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 1, photoKey("b")),
        )
        val event = slot<PhotosDeletedEvent>()

        // when
        memberPhotoService.replace(MEMBER_ID, listOf(photoKey("a")), emptyList())

        // then
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.objectKeys).containsExactly(photoKey("b"))
    }

    @Test
    fun `그대로 둔 사진은 삭제 이벤트에 담지 않는다`() {
        // given
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns listOf(
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 0, photoKey("a")),
        )

        // when
        memberPhotoService.replace(MEMBER_ID, listOf(photoKey("a")), emptyList())

        // then
        verify(exactly = 0) { eventPublisher.publishEvent(any<PhotosDeletedEvent>()) }
    }

    @Test
    fun `새로 추가한 사진만 업로드를 확인한다`() {
        // given
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns listOf(
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 0, photoKey("a")),
        )

        // when
        memberPhotoService.replace(
            MEMBER_ID,
            listOf(photoKey("a"), photoKey("b")),
            listOf(photoKey("c", PhotoVisibility.SECRET)),
        )

        // then
        verify { photoUploadService.confirm(listOf(photoKey("b"), photoKey("c", PhotoVisibility.SECRET))) }
    }

    @Test
    fun `새 사진의 업로드 확인이 실패하면 기존 사진을 건드리지 않는다`() {
        // given
        every { photoUploadService.confirm(listOf(photoKey("b"))) } throws
            BusinessException(ErrorCode.INVALID_PHOTO_KEY)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberPhotoService.replace(MEMBER_ID, listOf(photoKey("b")), emptyList())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { memberPhotoRepository.deleteAllByMemberId(any()) }
        verify(exactly = 0) { memberPhotoRepository.saveAll(any<List<MemberPhoto>>()) }
        verify(exactly = 0) { eventPublisher.publishEvent(any<PhotosDeletedEvent>()) }
    }

    @Test
    fun `업로드 URL은 공개 여부에 따라 다른 폴더로 발급한다`() {
        // given
        val prefix = slot<String>()
        every { photoUploadService.createUploadUrl(any(), capture(prefix), any()) } returns
            PhotoUploadUrlResponse("https://upload.test/key", "members/$MEMBER_ID/secret/key.jpg")

        // when
        val response = memberPhotoService.createUploadUrl(MEMBER_ID, PhotoVisibility.SECRET, "image/jpeg")

        // then
        assertThat(prefix.captured).isEqualTo("members/$MEMBER_ID/secret/")
        assertThat(response.objectKey).isEqualTo("members/$MEMBER_ID/secret/key.jpg")
    }

    @Test
    fun `프로필 사진은 공개를 고정 URL로, 비밀을 서명 URL로 준다`() {
        // given
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns listOf(
            MemberPhoto(MEMBER_ID, PhotoVisibility.SECRET, 0, photoKey("s", PhotoVisibility.SECRET)),
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 1, photoKey("b")),
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 0, photoKey("a")),
        )
        every { photoStorage.toPublicUrl(any()) } answers { "https://cdn.test/${firstArg<String>()}" }
        every { photoStorage.createSignedViewUrl(any()) } answers { "https://signed.test/${firstArg<String>()}" }

        // when
        val photos = memberPhotoService.findProfilePhotos(MEMBER_ID)

        // then
        assertThat(photos[PhotoVisibility.PUBLIC]).containsExactly(
            ProfilePhotoResponse(photoKey("a"), "https://cdn.test/${photoKey("a")}"),
            ProfilePhotoResponse(photoKey("b"), "https://cdn.test/${photoKey("b")}"),
        )
        assertThat(photos[PhotoVisibility.SECRET]).containsExactly(
            ProfilePhotoResponse(
                photoKey("s", PhotoVisibility.SECRET),
                "https://signed.test/${photoKey("s", PhotoVisibility.SECRET)}",
            ),
        )
    }

    @Test
    fun `공개 여부로 지우면 그쪽 사진만 지우고 삭제 이벤트를 발행한다`() {
        // given
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns listOf(
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 0, photoKey("a")),
            MemberPhoto(MEMBER_ID, PhotoVisibility.SECRET, 0, photoKey("s", PhotoVisibility.SECRET)),
        )
        val event = slot<PhotosDeletedEvent>()

        // when
        memberPhotoService.deleteByVisibility(MEMBER_ID, PhotoVisibility.PUBLIC)

        // then
        verify { memberPhotoRepository.deleteAll(any<List<MemberPhoto>>()) }
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.objectKeys).containsExactly(photoKey("a"))
    }

    @Test
    fun `지울 사진이 없으면 아무것도 하지 않는다`() {
        // when
        memberPhotoService.deleteByVisibility(MEMBER_ID, PhotoVisibility.PUBLIC)

        // then
        verify(exactly = 0) { memberPhotoRepository.deleteAll(any<List<MemberPhoto>>()) }
        verify(exactly = 0) { eventPublisher.publishEvent(any<PhotosDeletedEvent>()) }
    }

    private fun photoKey(name: String, visibility: PhotoVisibility = PhotoVisibility.PUBLIC) =
        "members/$MEMBER_ID/${visibility.name.lowercase()}/$name.jpg"

    companion object {

        private const val MEMBER_ID = 1L
    }
}
