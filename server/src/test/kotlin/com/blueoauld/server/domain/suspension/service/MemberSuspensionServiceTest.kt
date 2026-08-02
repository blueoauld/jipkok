package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
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

    private val memberSuspensionService = MemberSuspensionService(
        memberSuspensionRepository,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { memberSuspensionRepository.existsActive(any(), any(), any()) } returns false
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
