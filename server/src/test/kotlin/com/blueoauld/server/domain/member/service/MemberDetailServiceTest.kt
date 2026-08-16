package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.favorite.repository.MemberFavoriteRepository
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.profileview.event.ProfileViewedEvent
import com.blueoauld.server.domain.secretphoto.repository.SecretPhotoAccessRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.within
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class MemberDetailServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val memberPhotoRepository = mockk<MemberPhotoRepository>(relaxed = true)

    private val memberLikeRepository = mockk<MemberLikeRepository>(relaxed = true)

    private val memberFavoriteRepository = mockk<MemberFavoriteRepository>(relaxed = true)

    private val secretPhotoAccessRepository = mockk<SecretPhotoAccessRepository>(relaxed = true)

    private val memberBlockRepository = mockk<MemberBlockRepository>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val memberDetailService = MemberDetailService(
        memberRepository,
        memberPhotoRepository,
        memberLikeRepository,
        memberFavoriteRepository,
        secretPhotoAccessRepository,
        memberBlockRepository,
        eventPublisher,
        photoStorage,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findById(ME_ID) } returns Optional.of(member(37.5, 127.0))
        every { memberRepository.findById(TARGET_ID) } returns Optional.of(member(37.51, 127.0, "상대"))
        every { memberPhotoRepository.findAllByMemberId(TARGET_ID) } returns listOf(
            MemberPhoto(TARGET_ID, PhotoVisibility.PUBLIC, 1, "members/$TARGET_ID/public/b.jpg"),
            MemberPhoto(TARGET_ID, PhotoVisibility.PUBLIC, 0, "members/$TARGET_ID/public/a.jpg"),
            MemberPhoto(TARGET_ID, PhotoVisibility.SECRET, 0, "members/$TARGET_ID/secret/s.jpg"),
        )
        every { photoStorage.toPublicUrl(any()) } answers { "https://cdn.test/${firstArg<String>()}" }
        every { memberBlockRepository.existsByBlockerIdAndBlockedMemberId(any(), any()) } returns false
    }

    @Test
    fun `공개 사진을 순서대로 주고 거리와 관계를 담는다`() {
        // given
        every { memberLikeRepository.existsByLikerIdAndLikedMemberId(ME_ID, TARGET_ID) } returns true
        every { secretPhotoAccessRepository.existsByOwnerIdAndViewerId(TARGET_ID, ME_ID) } returns true

        // when
        val response = memberDetailService.findDetail(ME_ID, TARGET_ID)

        // then
        assertThat(response.publicPhotoUrls).containsExactly(
            "https://cdn.test/members/$TARGET_ID/public/a.jpg",
            "https://cdn.test/members/$TARGET_ID/public/b.jpg",
        )
        assertThat(response.secretPhotoCount).isEqualTo(1)
        assertThat(response.likedByMe).isTrue()
        assertThat(response.secretPhotoGrantedToMe).isTrue()
        assertThat(response.secretPhotoGrantedByMe).isFalse()
        assertThat(response.distance).isCloseTo(1112.0, within(20.0))
        assertThat(response.comment).isEqualTo("코멘트")
        assertThat(response.bio).isEqualTo("자기소개")
    }

    @Test
    fun `조회하면 기록을 이벤트로 알린다`() {
        // given

        // when
        memberDetailService.findDetail(ME_ID, TARGET_ID)

        // then
        verify { eventPublisher.publishEvent(ProfileViewedEvent(ME_ID, TARGET_ID)) }
    }

    @Test
    fun `차단 관계면 조회를 기록하지 않는다`() {
        // given
        every { memberBlockRepository.existsByBlockerIdAndBlockedMemberId(TARGET_ID, ME_ID) } returns true

        // when
        memberDetailService.findDetail(ME_ID, TARGET_ID)

        // then
        verify(exactly = 0) { eventPublisher.publishEvent(any<ProfileViewedEvent>()) }
    }

    @Test
    fun `상대가 나를 차단했으면 사진과 글을 비운다`() {
        // given
        every { memberBlockRepository.existsByBlockerIdAndBlockedMemberId(TARGET_ID, ME_ID) } returns true

        // when
        val response = memberDetailService.findDetail(ME_ID, TARGET_ID)

        // then
        assertThat(response.publicPhotoUrls).isEmpty()
        assertThat(response.comment).isNull()
        assertThat(response.bio).isNull()
        assertThat(response.nickname).isEqualTo("상대")
        assertThat(response.distance).isNotNull()
    }

    @Test
    fun `내가 차단했어도 그대로 보여준다`() {
        // given
        every { memberBlockRepository.existsByBlockerIdAndBlockedMemberId(ME_ID, TARGET_ID) } returns true

        // when
        val response = memberDetailService.findDetail(ME_ID, TARGET_ID)

        // then
        assertThat(response.blockedByMe).isTrue()
        assertThat(response.publicPhotoUrls).isNotEmpty()
        assertThat(response.comment).isEqualTo("코멘트")
    }

    @Test
    fun `상대의 쪽지 수신 여부를 담는다`() {
        // given
        every { memberRepository.findById(TARGET_ID) } returns
                Optional.of(member(37.51, 127.0, "상대").apply { noteReceiveEnabled = false })

        // when
        val response = memberDetailService.findDetail(ME_ID, TARGET_ID)

        // then
        assertThat(response.noteReceiveEnabled).isFalse()
    }

    @Test
    fun `좌표가 없으면 거리는 비어 있다`() {
        // given
        every { memberRepository.findById(ME_ID) } returns Optional.of(member(null, null))

        // when
        val response = memberDetailService.findDetail(ME_ID, TARGET_ID)

        // then
        assertThat(response.distance).isNull()
    }

    @Test
    fun `자기 자신은 조회할 수 없다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberDetailService.findDetail(ME_ID, ME_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_MEMBER_DETAIL)
    }

    @Test
    fun `없는 회원이면 실패한다`() {
        // given
        every { memberRepository.findById(TARGET_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberDetailService.findDetail(ME_ID, TARGET_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    private fun member(latitude: Double?, longitude: Double?, nickname: String = "나") = Member(
        phoneNumber = "01012345678",
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = nickname,
        birthYear = 1998,
        comment = "코멘트",
        bio = "자기소개",
    ).apply {
        this.latitude = latitude
        this.longitude = longitude
        this.locatedAt = NOW
    }

    companion object {

        private const val ME_ID = 1L
        private const val TARGET_ID = 2L

        private val NOW: Instant = Instant.parse("2026-08-02T05:00:00Z")
    }
}
