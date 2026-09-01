package com.blueoauld.server.domain.memo.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.memo.entity.MemberMemo
import com.blueoauld.server.domain.memo.repository.MemberMemoRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class MemberMemoServiceTest {

    private val memberMemoRepository = mockk<MemberMemoRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>()

    private val service = MemberMemoService(memberMemoRepository, memberRepository)

    @BeforeEach
    fun setUp() {
        every { memberRepository.existsById(TARGET_ID) } returns true
        every { memberMemoRepository.findByOwnerIdAndTargetId(OWNER_ID, TARGET_ID) } returns null
    }

    @Test
    fun `처음 쓰면 메모를 저장한다`() {
        // given
        val saved = slot<MemberMemo>()
        every { memberMemoRepository.save(capture(saved)) } answers { firstArg() }

        // when
        service.update(OWNER_ID, TARGET_ID, "  등산 얘기했던 분  ")

        // then
        assertThat(saved.captured.ownerId).isEqualTo(OWNER_ID)
        assertThat(saved.captured.targetId).isEqualTo(TARGET_ID)
        assertThat(saved.captured.content).isEqualTo("등산 얘기했던 분")
    }

    @Test
    fun `이미 있으면 내용만 바꾼다`() {
        // given
        val memo = MemberMemo(OWNER_ID, TARGET_ID, "이전 메모")
        every { memberMemoRepository.findByOwnerIdAndTargetId(OWNER_ID, TARGET_ID) } returns memo

        // when
        service.update(OWNER_ID, TARGET_ID, "새 메모")

        // then
        assertThat(memo.content).isEqualTo("새 메모")
        verify(exactly = 0) { memberMemoRepository.save(any()) }
    }

    @Test
    fun `비우면 메모를 지운다`() {
        // when
        service.update(OWNER_ID, TARGET_ID, "   ")

        // then
        verify { memberMemoRepository.deleteByOwnerIdAndTargetId(OWNER_ID, TARGET_ID) }
        verify(exactly = 0) { memberMemoRepository.save(any()) }
    }

    @Test
    fun `자기 자신에게는 메모를 남길 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            service.update(OWNER_ID, OWNER_ID, "메모")
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_MEMO)
    }

    @Test
    fun `없는 회원에게는 메모를 남길 수 없다`() {
        // given
        every { memberRepository.existsById(TARGET_ID) } returns false

        // when
        val exception = assertThrows(BusinessException::class.java) {
            service.update(OWNER_ID, TARGET_ID, "메모")
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    @Test
    fun `대상별 메모 내용을 표로 준다`() {
        // given
        every { memberMemoRepository.findAllByOwnerIdAndTargetIdIn(OWNER_ID, listOf(2L, 3L)) } returns listOf(
            MemberMemo(OWNER_ID, 2L, "등산"),
        )

        // when
        val contents = service.findContents(OWNER_ID, listOf(2L, 3L, 2L))

        // then
        assertThat(contents).isEqualTo(mapOf(2L to "등산"))
    }

    companion object {

        private const val OWNER_ID = 1L
        private const val TARGET_ID = 2L
    }
}
