package com.blueoauld.server.domain.secretphoto.service

import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.domain.secretphoto.entity.SecretPhotoAccess
import com.blueoauld.server.domain.secretphoto.repository.SecretPhotoAccessRepository
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
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

class SecretPhotoAccessServiceTest {

    private val secretPhotoAccessRepository = mockk<SecretPhotoAccessRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val memberSummaryService = mockk<MemberSummaryService>(relaxed = true)

    private val memberPhotoRepository = mockk<MemberPhotoRepository>(relaxed = true)

    private val memberBlockRepository = mockk<MemberBlockRepository>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val memberSuspensionService = mockk<MemberSuspensionService>(relaxed = true)

    private val secretPhotoAccessService = SecretPhotoAccessService(
        secretPhotoAccessRepository,
        memberRepository,
        memberSummaryService,
        memberPhotoRepository,
        memberBlockRepository,
        photoStorage,
        memberSuspensionService,
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.existsById(VIEWER_ID) } returns true
        every { secretPhotoAccessRepository.existsByOwnerIdAndViewerId(any(), any()) } returns false
        every { secretPhotoAccessRepository.saveAndFlush(any()) } answers { firstArg() }
    }

    @Test
    fun `공개받았으면 비밀 사진을 순서대로 준다`() {
        // given
        allowView()

        // when
        val urls = secretPhotoAccessService.findPhotoUrls(VIEWER_ID, OWNER_ID)

        // then
        assertThat(urls).containsExactly("signed:a.jpg", "signed:b.jpg")
    }

    @Test
    fun `비밀 사진 정지 중이면 볼 수 없다`() {
        // given
        allowView()
        every {
            memberSuspensionService.check(VIEWER_ID, SuspensionType.SECRET_PHOTO)
        } throws BusinessException(ErrorCode.SECRET_PHOTO_SUSPENDED)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            secretPhotoAccessService.findPhotoUrls(VIEWER_ID, OWNER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SECRET_PHOTO_SUSPENDED)
        verify(exactly = 0) { photoStorage.createSignedViewUrl(any()) }
    }

    @Test
    fun `공개받지 않았으면 볼 수 없다`() {
        // given
        allowView()
        every { secretPhotoAccessRepository.existsByOwnerIdAndViewerId(OWNER_ID, VIEWER_ID) } returns false

        // when
        val exception = assertThrows(BusinessException::class.java) {
            secretPhotoAccessService.findPhotoUrls(VIEWER_ID, OWNER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SECRET_PHOTO_FORBIDDEN)
    }

    @Test
    fun `차단 관계면 공개받았어도 볼 수 없다`() {
        // given
        allowView()
        every { memberBlockRepository.existsBetween(VIEWER_ID, OWNER_ID) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            secretPhotoAccessService.findPhotoUrls(VIEWER_ID, OWNER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SECRET_PHOTO_FORBIDDEN)
    }

    @Test
    fun `자기 자신의 비밀 사진은 이 API로 볼 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            secretPhotoAccessService.findPhotoUrls(VIEWER_ID, VIEWER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_SECRET_PHOTO_ACCESS)
    }

    @Test
    fun `비밀 사진을 공개하면 권한을 남긴다`() {
        // given
        val saved = slot<SecretPhotoAccess>()

        // when
        secretPhotoAccessService.grant(OWNER_ID, VIEWER_ID)

        // then
        verify { secretPhotoAccessRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.ownerId).isEqualTo(OWNER_ID)
        assertThat(saved.captured.viewerId).isEqualTo(VIEWER_ID)
    }

    @Test
    fun `이미 공개한 상대에게 또 공개해도 권한이 늘지 않는다`() {
        // given
        every { secretPhotoAccessRepository.existsByOwnerIdAndViewerId(OWNER_ID, VIEWER_ID) } returns true

        // when
        secretPhotoAccessService.grant(OWNER_ID, VIEWER_ID)

        // then
        verify(exactly = 0) { secretPhotoAccessRepository.saveAndFlush(any()) }
    }

    @Test
    fun `자기 자신에게는 비밀 사진을 공개할 수 없다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            secretPhotoAccessService.grant(OWNER_ID, OWNER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_SECRET_PHOTO_ACCESS)
        verify(exactly = 0) { secretPhotoAccessRepository.saveAndFlush(any()) }
    }

    @Test
    fun `없는 회원에게는 비밀 사진을 공개할 수 없다`() {
        // given
        every { memberRepository.existsById(VIEWER_ID) } returns false

        // when
        val exception = assertThrows(BusinessException::class.java) {
            secretPhotoAccessService.grant(OWNER_ID, VIEWER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
        verify(exactly = 0) { secretPhotoAccessRepository.saveAndFlush(any()) }
    }

    @Test
    fun `공개를 해제하면 권한을 지운다`() {
        // given

        // when
        secretPhotoAccessService.revoke(OWNER_ID, VIEWER_ID)

        // then
        verify { secretPhotoAccessRepository.deleteByOwnerIdAndViewerId(OWNER_ID, VIEWER_ID) }
    }

    @Test
    fun `내가 공개한 목록은 열람자를 준다`() {
        // given
        val accesses = listOf(access(30L, VIEWER_ID), access(20L, 3L))
        every {
            secretPhotoAccessRepository.findByOwnerIdAndIdLessThanOrderByIdDesc(OWNER_ID, Long.MAX_VALUE, any())
        } returns accesses
        every { memberSummaryService.findSummaries(OWNER_ID, listOf(VIEWER_ID, 3L)) } returns
            listOf(summary(VIEWER_ID), summary(3L))

        // when
        val response = secretPhotoAccessService.findGranted(OWNER_ID, null, 2)

        // then
        assertThat(response.items).extracting("memberId").containsExactly(VIEWER_ID, 3L)
        assertThat(response.nextCursor).isEqualTo(20L)
    }

    @Test
    fun `나에게 공개된 목록은 공개한 사람을 준다`() {
        // given
        every {
            secretPhotoAccessRepository.findByViewerIdAndIdLessThanOrderByIdDesc(VIEWER_ID, 40L, any())
        } returns listOf(access(30L, VIEWER_ID))

        // when
        secretPhotoAccessService.findReceived(VIEWER_ID, 40L, 20)

        // then
        verify { memberSummaryService.findSummaries(VIEWER_ID, listOf(OWNER_ID)) }
    }

    private fun access(id: Long, viewerId: Long) = mockk<SecretPhotoAccess>(relaxed = true) {
        every { this@mockk.id } returns id
        every { ownerId } returns OWNER_ID
        every { this@mockk.viewerId } returns viewerId
    }

    private fun summary(memberId: Long) = MemberSummaryResponse(
        memberId = memberId,
        nickname = "닉네임",
        gender = Gender.MALE,
        age = 28,
        receivedLikeCount = 0,
        comment = null,
        profileImageUrl = null,
        memo = null,
    )

    private fun allowView() {
        every { secretPhotoAccessRepository.existsByOwnerIdAndViewerId(OWNER_ID, VIEWER_ID) } returns true
        every { memberBlockRepository.existsBetween(any(), any()) } returns false
        every { memberPhotoRepository.findAllByMemberId(OWNER_ID) } returns listOf(
            MemberPhoto(OWNER_ID, PhotoVisibility.SECRET, 2, "b.jpg"),
            MemberPhoto(OWNER_ID, PhotoVisibility.PUBLIC, 1, "public.jpg"),
            MemberPhoto(OWNER_ID, PhotoVisibility.SECRET, 1, "a.jpg"),
        )
        every { photoStorage.createSignedViewUrl(any()) } answers { "signed:${firstArg<String>()}" }
    }

    companion object {

        private const val OWNER_ID = 1L
        private const val VIEWER_ID = 2L
    }
}
