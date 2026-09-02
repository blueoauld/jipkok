package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.projection.MemberNickname
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.NicknameHistory
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
    )

    @BeforeEach
    fun setUp() {
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns emptyList()
        every { nicknameHistoryRepository.save(any()) } answers { firstArg() }
    }

    @Test
    fun `닉네임 묶음 조회는 중복을 정리하고 없는 회원을 대체 문구로 채운다`() {
        // given
        every { memberRepository.findNicknamesByIdIn(listOf(1L, 2L)) } returns listOf(memberNickname(1L, "밤산책"))

        // when
        val nicknames = memberAdminService.findNicknames(listOf(1L, 2L, 1L))

        // then
        assertThat(nicknames).isEqualTo(mapOf(1L to "밤산책", 2L to "알 수 없음"))
    }

    @Test
    fun `조회할 회원이 없으면 닉네임을 찾지 않는다`() {
        // given

        // when
        val nicknames = memberAdminService.findNicknames(emptyList())

        // then
        assertThat(nicknames).isEmpty()
        verify(exactly = 0) { memberRepository.findNicknamesByIdIn(any()) }
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
    fun `닉네임을 초기화하면 무작위 닉네임으로 바꾸고 이력을 남긴다`() {
        // given
        val member = member()
        val before = member.nickname
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        val history = slot<NicknameHistory>()

        // when
        memberAdminService.resetProfile(MEMBER_ID, ProfileTarget.NICKNAME)

        // then
        assertThat(member.nickname).isNotEqualTo(before)
        assertThat(member.nickname).hasSize(Member.NICKNAME_MAX_LENGTH)
        verify { nicknameHistoryRepository.save(capture(history)) }
        assertThat(history.captured.nickname).isEqualTo(member.nickname)
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

    private fun memberNickname(id: Long, nickname: String) = object : MemberNickname {
        override val id = id
        override val nickname = nickname
    }

    private fun member() = Member(
        phoneNumber = PHONE_NUMBER,
        password = ENCODED_PASSWORD,
        gender = Gender.MALE,
        nickname = "default000",
        birthYear = MemberSignupService.DEFAULT_BIRTH_YEAR,
    )

    companion object {

        private const val PHONE_NUMBER = "+821012345678"
        private const val ENCODED_PASSWORD = "encoded-password"
        private const val MEMBER_ID = 0L
    }
}
