package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import com.blueoauld.server.domain.suspension.repository.SuspendedMemberCache
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

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
        every { suspendedMemberCache.find(any(), any()) } returns null
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

    companion object {

        private const val MEMBER_ID = 1L

        private val NOW: Instant = Instant.parse("2026-08-03T05:00:00Z")
    }
}
