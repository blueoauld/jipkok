package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.request.CreateProfilePhotoUploadUrlRequest
import com.blueoauld.server.domain.member.dto.request.EditProfileRequest
import com.blueoauld.server.domain.member.dto.request.SetupProfileRequest
import com.blueoauld.server.domain.member.dto.request.UpdateCommentRequest
import com.blueoauld.server.domain.member.dto.response.ProfilePhotoResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.dto.PhotoUploadUrlResponse
import com.blueoauld.server.global.storage.event.PhotosDeletedEvent
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
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
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class MemberServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val memberPhotoRepository = mockk<MemberPhotoRepository>(relaxed = true)

    private val nicknameHistoryRepository = mockk<NicknameHistoryRepository>(relaxed = true)

    private val photoUploadService = mockk<PhotoUploadService>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val memberSuspensionService = mockk<MemberSuspensionService>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val memberService = MemberService(
        memberRepository,
        memberPhotoRepository,
        nicknameHistoryRepository,
        photoUploadService,
        photoStorage,
        memberSuspensionService,
        eventPublisher,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.save(any()) } answers { firstArg() }
        every { nicknameHistoryRepository.save(any()) } answers { firstArg() }
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns emptyList()
        every { photoUploadService.createUploadUrl(any(), any(), any()) } answers {
            PhotoUploadUrlResponse("https://upload.test/key", secondArg<String>() + "key.jpg")
        }
        every { photoStorage.createUploadUrl(any(), any()) } answers { "https://upload.test/${firstArg<String>()}" }
    }

    @Test
    fun `프로필을 설정하면 닉네임과 출생연도와 자기소개가 채워진다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        memberService.setupProfile(MEMBER_ID, SetupProfileRequest(NICKNAME, 1998, "자기소개"))

        // then
        assertThat(member.nickname).isEqualTo(NICKNAME)
        assertThat(member.birthYear).isEqualTo(1998)
        assertThat(member.bio).isEqualTo("자기소개")
    }

    @Test
    fun `이미 쓰는 닉네임이면 프로필 설정에 실패한다`() {
        // given
        val member = member()
        stubMember(member)
        every { memberRepository.existsByNicknameIgnoreCase(NICKNAME) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.setupProfile(MEMBER_ID, SetupProfileRequest(NICKNAME, 1998))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DUPLICATE_NICKNAME)
        assertThat(member.nickname).isNotEqualTo(NICKNAME)
    }

    @Test
    fun `쓰던 닉네임을 그대로 보내면 중복으로 보지 않는다`() {
        // given
        val member = member()
        stubMember(member)
        every { memberRepository.existsByNicknameIgnoreCase(member.nickname) } returns true

        // when
        memberService.setupProfile(MEMBER_ID, SetupProfileRequest(member.nickname, 1998))

        // then
        assertThat(member.birthYear).isEqualTo(1998)
    }

    @Test
    fun `닉네임 앞뒤 공백은 잘라내고 중간 공백은 그대로 둔다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        memberService.setupProfile(MEMBER_ID, SetupProfileRequest("  홍  길동  ", 1998))

        // then
        assertThat(member.nickname).isEqualTo("홍  길동")
    }

    @Test
    fun `대소문자만 다른 닉네임은 중복으로 본다`() {
        // given
        val member = member()
        stubMember(member)
        every { memberRepository.existsByNicknameIgnoreCase("hong") } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.setupProfile(MEMBER_ID, SetupProfileRequest("hong", 1998))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DUPLICATE_NICKNAME)
    }

    @Test
    fun `쓰던 닉네임의 대소문자만 바꾸는 것은 허용한다`() {
        // given
        val member = member()
        member.nickname = "hong"
        stubMember(member)
        every { memberRepository.existsByNicknameIgnoreCase("Hong") } returns true

        // when
        memberService.setupProfile(MEMBER_ID, SetupProfileRequest("Hong", 1998))

        // then
        assertThat(member.nickname).isEqualTo("Hong")
    }

    @Test
    fun `만 19세가 되는 해면 프로필을 설정할 수 있다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        memberService.setupProfile(MEMBER_ID, SetupProfileRequest(NICKNAME, 2007))

        // then
        assertThat(member.birthYear).isEqualTo(2007)
    }

    @Test
    fun `만 19세가 되지 않으면 프로필 설정에 실패한다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.setupProfile(MEMBER_ID, SetupProfileRequest(NICKNAME, 2008))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_BIRTH_YEAR)
        assertThat(member.nickname).isNotEqualTo(NICKNAME)
    }

    @Test
    fun `만 90세면 프로필을 설정할 수 있다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        memberService.setupProfile(MEMBER_ID, SetupProfileRequest(NICKNAME, 1936))

        // then
        assertThat(member.birthYear).isEqualTo(1936)
    }

    @Test
    fun `만 90세를 넘으면 프로필 설정에 실패한다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.setupProfile(MEMBER_ID, SetupProfileRequest(NICKNAME, 1935))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_BIRTH_YEAR)
        assertThat(member.nickname).isNotEqualTo(NICKNAME)
    }

    @Test
    fun `없는 회원이면 프로필 설정에 실패한다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.setupProfile(MEMBER_ID, SetupProfileRequest(NICKNAME, 1998))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    @Test
    fun `내 프로필은 공개 사진을 고정 URL로, 비밀 사진을 서명 URL로 준다`() {
        // given
        val member = member()
        member.comment = "코멘트"
        member.bio = "자기소개"
        stubMember(member)
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns listOf(
            MemberPhoto(MEMBER_ID, PhotoVisibility.SECRET, 0, photoKey("s", PhotoVisibility.SECRET)),
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 1, photoKey("b")),
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 0, photoKey("a")),
        )
        every { photoStorage.toPublicUrl(any()) } answers { "https://cdn.test/${firstArg<String>()}" }
        every { photoStorage.createSignedViewUrl(any()) } answers { "https://signed.test/${firstArg<String>()}" }

        // when
        val response = memberService.findMyProfile(MEMBER_ID)

        // then
        assertThat(response.publicPhotos).containsExactly(
            ProfilePhotoResponse(photoKey("a"), "https://cdn.test/${photoKey("a")}"),
            ProfilePhotoResponse(photoKey("b"), "https://cdn.test/${photoKey("b")}"),
        )
        assertThat(response.secretPhotos).containsExactly(
            ProfilePhotoResponse(
                photoKey("s", PhotoVisibility.SECRET),
                "https://signed.test/${photoKey("s", PhotoVisibility.SECRET)}",
            ),
        )
        assertThat(response.nickname).isEqualTo(member.nickname)
        assertThat(response.comment).isEqualTo("코멘트")
        assertThat(response.bio).isEqualTo("자기소개")
    }

    @Test
    fun `내 프로필의 나이는 출생연도로 계산한다`() {
        // given
        val member = member()
        member.birthYear = 2000
        stubMember(member)

        // when
        val response = memberService.findMyProfile(MEMBER_ID)

        // then
        assertThat(response.birthYear).isEqualTo(2000)
        assertThat(response.age).isEqualTo(26)
    }

    @Test
    fun `없는 회원이면 프로필 조회에 실패한다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.findMyProfile(MEMBER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    @Test
    fun `프로필 수정 정지 중이면 편집할 수 없다`() {
        // given
        every {
            memberSuspensionService.check(MEMBER_ID, SuspensionType.PROFILE_EDIT)
        } throws BusinessException(ErrorCode.PROFILE_EDIT_SUSPENDED)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.editProfile(MEMBER_ID, EditProfileRequest(NICKNAME, 1998))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.PROFILE_EDIT_SUSPENDED)
        verify(exactly = 0) { memberPhotoRepository.deleteAllByMemberId(any()) }
    }

    @Test
    fun `프로필을 편집하면 공개 사진과 비밀 사진을 보낸 순서대로 저장한다`() {
        // given
        val member = member()
        stubMember(member)
        val saved = slot<List<MemberPhoto>>()

        // when
        memberService.editProfile(
            MEMBER_ID,
            EditProfileRequest(
                nickname = NICKNAME,
                birthYear = 1998,
                publicPhotoKeys = listOf(photoKey("a"), photoKey("b")),
                secretPhotoKeys = listOf(photoKey("c", PhotoVisibility.SECRET)),
            ),
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
        val member = member()
        stubMember(member)
        val saved = slot<List<MemberPhoto>>()

        // when
        memberService.editProfile(MEMBER_ID, EditProfileRequest(NICKNAME, 1998))

        // then
        verify { memberPhotoRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { memberPhotoRepository.saveAll(capture(saved)) }
        assertThat(saved.captured).isEmpty()
    }

    @Test
    fun `남의 사진 키를 보내면 편집에 실패한다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.editProfile(
                MEMBER_ID,
                EditProfileRequest(NICKNAME, 1998, publicPhotoKeys = listOf("members/999/public/other.jpg")),
            )
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { memberPhotoRepository.saveAll(any<List<MemberPhoto>>()) }
    }

    @Test
    fun `같은 사진 키를 두 번 보내면 편집에 실패한다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.editProfile(
                MEMBER_ID,
                EditProfileRequest(
                    nickname = NICKNAME,
                    birthYear = 1998,
                    publicPhotoKeys = listOf(photoKey("a"), photoKey("a")),
                ),
            )
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { memberPhotoRepository.saveAll(any<List<MemberPhoto>>()) }
    }

    @Test
    fun `비밀 사진 키를 공개 사진으로 보내면 편집에 실패한다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.editProfile(
                MEMBER_ID,
                EditProfileRequest(
                    nickname = NICKNAME,
                    birthYear = 1998,
                    publicPhotoKeys = listOf(photoKey("a", PhotoVisibility.SECRET)),
                ),
            )
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { memberPhotoRepository.saveAll(any<List<MemberPhoto>>()) }
    }

    @Test
    fun `업로드 URL은 공개 여부에 따라 다른 폴더로 발급한다`() {
        // given
        val prefix = slot<String>()
        every { photoUploadService.createUploadUrl(any(), capture(prefix), any()) } returns
            PhotoUploadUrlResponse("https://upload.test/key", "members/$MEMBER_ID/secret/key.jpg")

        // when
        val response = memberService.createPhotoUploadUrl(
            MEMBER_ID,
            CreateProfilePhotoUploadUrlRequest("image/jpeg", PhotoVisibility.SECRET),
        )

        // then
        assertThat(prefix.captured).isEqualTo("members/$MEMBER_ID/secret/")
        assertThat(response.objectKey).isEqualTo("members/$MEMBER_ID/secret/key.jpg")
    }

    @Test
    fun `편집으로 빠진 사진은 삭제 이벤트를 발행한다`() {
        // given
        val member = member()
        stubMember(member)
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns listOf(
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 0, photoKey("a")),
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 1, photoKey("b")),
        )
        val event = slot<PhotosDeletedEvent>()

        // when
        memberService.editProfile(
            MEMBER_ID,
            EditProfileRequest(NICKNAME, 1998, publicPhotoKeys = listOf(photoKey("a"))),
        )

        // then
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.objectKeys).containsExactly(photoKey("b"))
    }

    @Test
    fun `그대로 둔 사진은 삭제 이벤트에 담지 않는다`() {
        // given
        val member = member()
        stubMember(member)
        every { memberPhotoRepository.findAllByMemberId(MEMBER_ID) } returns listOf(
            MemberPhoto(MEMBER_ID, PhotoVisibility.PUBLIC, 0, photoKey("a")),
        )

        // when
        memberService.editProfile(
            MEMBER_ID,
            EditProfileRequest(NICKNAME, 1998, publicPhotoKeys = listOf(photoKey("a"))),
        )

        // then
        verify(exactly = 0) { eventPublisher.publishEvent(ofType<PhotosDeletedEvent>()) }
    }

    @Test
    fun `확정된 사진은 발급 기록에서 지운다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        memberService.editProfile(
            MEMBER_ID,
            EditProfileRequest(NICKNAME, 1998, publicPhotoKeys = listOf(photoKey("a"))),
        )

        // then
        verify { photoUploadService.confirm(listOf(photoKey("a"))) }
    }

    @Test
    fun `코멘트를 앞뒤 공백까지 그대로 저장한다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        memberService.updateComment(MEMBER_ID, UpdateCommentRequest("  오늘 한잔  "))

        // then
        assertThat(member.comment).isEqualTo("  오늘 한잔  ")
    }

    @Test
    fun `코멘트를 빈 문자열로 보내면 지운다`() {
        // given
        val member = member()
        member.comment = "원래 코멘트"
        stubMember(member)

        // when
        memberService.updateComment(MEMBER_ID, UpdateCommentRequest(""))

        // then
        assertThat(member.comment).isNull()
    }

    @Test
    fun `공백만 있는 코멘트도 그대로 저장한다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        memberService.updateComment(MEMBER_ID, UpdateCommentRequest("   "))

        // then
        assertThat(member.comment).isEqualTo("   ")
    }

    @Test
    fun `코멘트를 보내지 않으면 지운다`() {
        // given
        val member = member()
        member.comment = "원래 코멘트"
        stubMember(member)

        // when
        memberService.updateComment(MEMBER_ID, UpdateCommentRequest())

        // then
        assertThat(member.comment).isNull()
    }

    @Test
    fun `없는 회원이면 코멘트 저장에 실패한다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberService.updateComment(MEMBER_ID, UpdateCommentRequest("오늘 한잔"))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    @Test
    fun `닉네임을 바꾸면 이력이 남는다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        memberService.setupProfile(MEMBER_ID, SetupProfileRequest(NICKNAME, 1998))

        // then
        verify {
            nicknameHistoryRepository.save(
                match { it.memberId == MEMBER_ID && it.nickname == NICKNAME },
            )
        }
    }

    @Test
    fun `닉네임이 그대로면 이력을 남기지 않는다`() {
        // given
        val member = member().apply { nickname = NICKNAME }
        stubMember(member)

        // when
        memberService.setupProfile(MEMBER_ID, SetupProfileRequest(NICKNAME, 1998))

        // then
        verify(exactly = 0) { nicknameHistoryRepository.save(any()) }
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

        private const val PHONE_NUMBER = "+821012345678"
        private const val ENCODED_PASSWORD = "encoded-password"
        private const val MEMBER_ID = 0L
        private const val NICKNAME = "닉네임"
        private val NOW: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
