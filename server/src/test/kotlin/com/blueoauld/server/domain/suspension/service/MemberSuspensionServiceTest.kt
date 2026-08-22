package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import com.blueoauld.server.domain.suspension.repository.SuspendedMemberCache
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class MemberSuspensionServiceTest {

    private val memberSuspensionRepository = mockk<MemberSuspensionRepository>(relaxed = true)

    private val suspendedMemberCache = mockk<SuspendedMemberCache>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val memberSuspensionService = MemberSuspensionService(
        memberSuspensionRepository,
        suspendedMemberCache,
        memberRepository,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { memberSuspensionRepository.existsActive(any(), any(), any()) } returns false
        every { memberSuspensionRepository.existsActiveByPhoneNumber(any(), any(), any()) } returns false
        every { memberSuspensionRepository.findActive(any(), any()) } returns emptyList()
        every { memberSuspensionRepository.save(any()) } answers { firstArg() }
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { memberRepository.findByPhoneNumber(PHONE_NUMBER) } returns null
        every { suspendedMemberCache.find(any(), any()) } returns null
    }

    @Test
    fun `정지하면 회원 정보를 담아 저장하고 캐시를 비운다`() {
        // given
        val saved = slot<MemberSuspension>()

        // when
        memberSuspensionService.suspend(
            MEMBER_ID,
            SuspensionType.SERVICE,
            SuspensionReason.ABUSE,
            days = 7,
            detail = "욕설",
        )

        // then
        verify { memberSuspensionRepository.save(capture(saved)) }
        verify { suspendedMemberCache.evict(MEMBER_ID) }
        assertThat(saved.captured.phoneNumber).isEqualTo(PHONE_NUMBER)
        assertThat(saved.captured.startedAt).isEqualTo(NOW)
        assertThat(saved.captured.expiresAt).isEqualTo(NOW.plus(Duration.ofDays(7)))
    }

    @Test
    fun `일수가 없으면 만료 없이 정지한다`() {
        // given
        val saved = slot<MemberSuspension>()

        // when
        memberSuspensionService.suspend(
            MEMBER_ID,
            SuspensionType.SERVICE,
            SuspensionReason.ABUSE,
            days = null,
            detail = null,
        )

        // then
        verify { memberSuspensionRepository.save(capture(saved)) }
        assertThat(saved.captured.expiresAt).isNull()
    }

    @Test
    fun `같은 유형으로 이미 정지 중이면 실패한다`() {
        // given
        every { memberSuspensionRepository.findActive(MEMBER_ID, NOW) } returns listOf(
            suspension(SuspensionType.SERVICE),
        )

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberSuspensionService.suspend(MEMBER_ID, SuspensionType.SERVICE, SuspensionReason.ABUSE, 7, null)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DUPLICATE_SUSPENSION)
        verify(exactly = 0) { memberSuspensionRepository.save(any()) }
    }

    @Test
    fun `다른 유형으로 정지 중이면 또 정지할 수 있다`() {
        // given
        every { memberSuspensionRepository.findActive(MEMBER_ID, NOW) } returns listOf(
            suspension(SuspensionType.SECRET_PHOTO),
        )

        // when
        memberSuspensionService.suspend(MEMBER_ID, SuspensionType.SERVICE, SuspensionReason.ABUSE, 7, null)

        // then
        verify { memberSuspensionRepository.save(any()) }
    }

    @Test
    fun `해제하면 해제 시각을 남기고 캐시를 비운다`() {
        // given
        val target = suspension(SuspensionType.SERVICE)
        every { memberSuspensionRepository.findActive(MEMBER_ID, NOW) } returns listOf(target)

        // when
        memberSuspensionService.release(MEMBER_ID, SuspensionType.SERVICE)

        // then
        assertThat(target.releasedAt).isEqualTo(NOW)
        verify { suspendedMemberCache.evict(MEMBER_ID) }
    }

    @Test
    fun `해제할 정지가 없으면 실패한다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberSuspensionService.release(MEMBER_ID, SuspensionType.SERVICE)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SUSPENSION_NOT_FOUND)
    }

    @Test
    fun `같은 번호를 쓰던 다른 계정의 캐시도 비운다`() {
        // given
        every { memberRepository.findByPhoneNumber(PHONE_NUMBER) } returns member(OTHER_MEMBER_ID)

        // when
        memberSuspensionService.suspend(MEMBER_ID, SuspensionType.SERVICE, SuspensionReason.ABUSE, 7, null)

        // then
        verify { suspendedMemberCache.evict(MEMBER_ID) }
        verify { suspendedMemberCache.evict(OTHER_MEMBER_ID) }
    }

    @Test
    fun `정지된 번호는 유형에 맞는 오류로 막는다`() {
        // given
        every {
            memberSuspensionRepository.existsActiveByPhoneNumber(PHONE_NUMBER, SuspensionType.SERVICE, NOW)
        } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberSuspensionService.checkPhoneNumber(PHONE_NUMBER, SuspensionType.SERVICE)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SERVICE_SUSPENDED)
    }

    @Test
    fun `정지되지 않은 번호는 통과한다`() {
        // when, then
        assertDoesNotThrow {
            memberSuspensionService.checkPhoneNumber(PHONE_NUMBER, SuspensionType.SERVICE)
        }
    }

    @Test
    fun `정지가 없으면 통과한다`() {
        // when, then
        assertDoesNotThrow { memberSuspensionService.check(MEMBER_ID, SuspensionType.SECRET_PHOTO) }
    }

    @Test
    fun `비밀 사진 정지면 막는다`() {
        // given
        every {
            memberSuspensionRepository.existsActive(MEMBER_ID, SuspensionType.SECRET_PHOTO, NOW)
        } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberSuspensionService.check(MEMBER_ID, SuspensionType.SECRET_PHOTO)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SECRET_PHOTO_SUSPENDED)
    }

    @Test
    fun `유형마다 다른 오류를 준다`() {
        // given
        every { memberSuspensionRepository.existsActive(any(), any(), any()) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberSuspensionService.check(MEMBER_ID, SuspensionType.SERVICE)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SERVICE_SUSPENDED)
    }

    @Test
    fun `조회한 결과는 캐시에 담는다`() {
        // when
        memberSuspensionService.check(MEMBER_ID, SuspensionType.SECRET_PHOTO)

        // then
        verify { suspendedMemberCache.save(MEMBER_ID, SuspensionType.SECRET_PHOTO, false) }
    }

    @Test
    fun `캐시에 있으면 조회하지 않는다`() {
        // given
        every { suspendedMemberCache.find(MEMBER_ID, SuspensionType.SECRET_PHOTO) } returns false

        // when
        memberSuspensionService.check(MEMBER_ID, SuspensionType.SECRET_PHOTO)

        // then
        verify(exactly = 0) { memberSuspensionRepository.existsActive(any(), any(), any()) }
    }

    @Test
    fun `캐시가 정지라고 하면 조회 없이 막는다`() {
        // given
        every { suspendedMemberCache.find(MEMBER_ID, SuspensionType.SERVICE) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberSuspensionService.check(MEMBER_ID, SuspensionType.SERVICE)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SERVICE_SUSPENDED)
        verify(exactly = 0) { memberSuspensionRepository.existsActive(any(), any(), any()) }
    }

    @Test
    fun `활성 정지는 현재 시각으로 조회한다`() {
        // when
        memberSuspensionService.findActive(MEMBER_ID)

        // then
        verify { memberSuspensionRepository.findActive(MEMBER_ID, NOW) }
    }

    private fun member(id: Long = MEMBER_ID) = Member(
        phoneNumber = PHONE_NUMBER,
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "홍길동",
        birthYear = 1998,
    ).also { setId(it, id) }

    private fun suspension(type: SuspensionType) = MemberSuspension(
        phoneNumber = PHONE_NUMBER,
        memberId = MEMBER_ID,
        nickname = "홍길동",
        type = type,
        reason = SuspensionReason.ABUSE,
        startedAt = NOW,
    )

    private fun setId(member: Member, id: Long) {
        val field = Member::class.java.getDeclaredField("id")

        field.isAccessible = true
        field.set(member, id)
    }

    companion object {

        private const val MEMBER_ID = 1L
        private const val OTHER_MEMBER_ID = 2L
        private const val PHONE_NUMBER = "+821011112222"

        private val NOW: Instant = Instant.parse("2026-08-03T05:00:00Z")
    }
}
