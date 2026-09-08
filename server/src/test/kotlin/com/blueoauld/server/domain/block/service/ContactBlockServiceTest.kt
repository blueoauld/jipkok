package com.blueoauld.server.domain.block.service

import com.blueoauld.server.domain.block.entity.ContactBlock
import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
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
import java.util.*

class ContactBlockServiceTest {

    private val contactBlockRepository = mockk<ContactBlockRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>()

    private val contactBlockService = ContactBlockService(contactBlockRepository, memberRepository)

    @BeforeEach
    fun setUp() {
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { contactBlockRepository.existsByMemberIdAndPhoneNumber(any(), any()) } returns false
        every { contactBlockRepository.countByMemberId(MEMBER_ID) } returns 0
        every { contactBlockRepository.saveAndFlush(any()) } answers { firstArg() }
    }

    @Test
    fun `번호를 차단 목록에 넣는다`() {
        // given
        val saved = slot<ContactBlock>()

        // when
        contactBlockService.add(MEMBER_ID, OTHER_PHONE_NUMBER, " 전 직장 ")

        // then
        verify { contactBlockRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.memberId).isEqualTo(MEMBER_ID)
        assertThat(saved.captured.phoneNumber).isEqualTo(OTHER_PHONE_NUMBER)
        assertThat(saved.captured.memo).isEqualTo("전 직장")
    }

    @Test
    fun `빈 메모는 남기지 않는다`() {
        // given
        val saved = slot<ContactBlock>()

        // when
        contactBlockService.add(MEMBER_ID, OTHER_PHONE_NUMBER, "  ")

        // then
        verify { contactBlockRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.memo).isNull()
    }

    @Test
    fun `내 번호는 차단할 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            contactBlockService.add(MEMBER_ID, MY_PHONE_NUMBER, null)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_BLOCK)
    }

    @Test
    fun `이미 차단한 번호는 다시 넣지 않는다`() {
        // given
        every { contactBlockRepository.existsByMemberIdAndPhoneNumber(MEMBER_ID, OTHER_PHONE_NUMBER) } returns true

        // when
        contactBlockService.add(MEMBER_ID, OTHER_PHONE_NUMBER, null)

        // then
        verify(exactly = 0) { contactBlockRepository.saveAndFlush(any()) }
    }

    @Test
    fun `한도를 채웠으면 더 넣을 수 없다`() {
        // given
        every { contactBlockRepository.countByMemberId(MEMBER_ID) } returns ContactBlock.MAX_PER_MEMBER.toLong()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            contactBlockService.add(MEMBER_ID, OTHER_PHONE_NUMBER, null)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CONTACT_BLOCK_LIMIT_EXCEEDED)
    }

    @Test
    fun `해제는 내 것만 지운다`() {
        // when
        contactBlockService.remove(MEMBER_ID, CONTACT_BLOCK_ID)

        // then
        verify { contactBlockRepository.deleteByIdAndMemberId(CONTACT_BLOCK_ID, MEMBER_ID) }
    }

    private fun member() = Member(
        phoneNumber = MY_PHONE_NUMBER,
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "닉네임",
        birthYear = 1998,
    )

    companion object {

        private const val MEMBER_ID = 1L
        private const val CONTACT_BLOCK_ID = 10L
        private const val MY_PHONE_NUMBER = "+821012340000"
        private const val OTHER_PHONE_NUMBER = "+821012340001"
    }
}
