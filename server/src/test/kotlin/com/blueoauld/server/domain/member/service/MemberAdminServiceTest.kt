package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.global.storage.event.PhotosDeletedEvent
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class MemberAdminServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val memberPhotoRepository = mockk<MemberPhotoRepository>(relaxed = true)

    private val nicknameHistoryRepository = mockk<NicknameHistoryRepository>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val memberAdminService = MemberAdminService(
        memberRepository,
        memberPhotoRepository,
        nicknameHistoryRepository,
        photoStorage,
        eventPublisher,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns emptyList()
        every { nicknameHistoryRepository.save(any()) } answers { firstArg() }
    }

    @Test
    fun `코멘트를 초기화하면 비운다`() {
        // given
        val member = member()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)

        // when
        memberAdminService.resetProfile(MEMBER_ID, ProfileTarget.COMMENT)

        // then
        assertThat(member.comment).isNull()
    }

    @Test
    fun `닉네임을 초기화하면 새 닉네임을 준다`() {
        // given
        val member = member()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)

        // when
        val nickname = memberAdminService.resetProfile(MEMBER_ID, ProfileTarget.NICKNAME)

        // then
        assertThat(nickname).isEqualTo(member.nickname).isNotEqualTo(NICKNAME)
    }

    @Test
    fun `공개 사진을 초기화하면 사진과 파일을 지운다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns listOf(
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 0, "public.jpg"),
            MemberPhoto(MEMBER_ID, PhotoVisibility.SECRET, 0, "secret.jpg"),
        )
        val event = slot<PhotosDeletedEvent>()

        // when
        memberAdminService.resetProfile(MEMBER_ID, ProfileTarget.PUBLIC_PHOTO)

        // then
        verify { memberPhotoRepository.deleteAll(any<List<MemberPhoto>>()) }
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.objectKeys).containsExactly("public.jpg")
    }

    private fun photoKey(name: String, visibility: PhotoVisibility = PhotoVisibility.PUBLIC) =
        "members/$MEMBER_ID/${visibility.name.lowercase()}/$name.jpg"

    private fun member() = Member(
        phoneNumber = PHONE_NUMBER,
        password = ENCODED_PASSWORD,
        gender = Gender.MALE,
        nickname = "default000",
        birthYear = MemberSignupService.DEFAULT_BIRTH_YEAR,
    )

    private fun stubMember(member: Member) {
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        every { memberRepository.existsByNicknameIgnoreCase(any()) } returns false
    }

    companion object {

        private const val PHONE_NUMBER = "01012345678"
        private const val ENCODED_PASSWORD = "encoded-password"
        private const val NICKNAME = "닉네임"
        private const val MEMBER_ID = 0L
        private val NOW: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
