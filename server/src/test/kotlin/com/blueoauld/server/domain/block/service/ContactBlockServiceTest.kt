package com.blueoauld.server.domain.block.service

import com.blueoauld.server.domain.block.entity.ContactBlock
import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import com.blueoauld.server.global.properties.ContactBlockProperties
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import io.mockk.verifyOrder
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class ContactBlockServiceTest {

    private val contactBlockRepository = mockk<ContactBlockRepository>(relaxed = true)

    private val phoneHasher = PhoneHasher(ContactBlockProperties("secret"))

    private val contactBlockService = ContactBlockService(contactBlockRepository, phoneHasher)

    @Test
    fun `번호를 해시로 바꿔 중복 없이 저장하고 이전 것은 먼저 지운다`() {
        // given
        val saved = slot<List<ContactBlock>>()
        every { contactBlockRepository.saveAll(capture(saved)) } answers { firstArg() }

        // when
        contactBlockService.replace(MEMBER_ID, listOf("+821012340000", "+821012340001", "+821012340000"))

        // then
        verifyOrder {
            contactBlockRepository.deleteAllByMemberId(MEMBER_ID)
            contactBlockRepository.saveAll(any<List<ContactBlock>>())
        }
        assertThat(saved.captured.map { it.phoneHash }).containsExactly(
            phoneHasher.hash("+821012340000"),
            phoneHasher.hash("+821012340001"),
        )
        assertThat(saved.captured.map { it.memberId }).containsOnly(MEMBER_ID)
    }

    @Test
    fun `해제하면 회원의 차단 번호를 전부 지운다`() {
        // when
        contactBlockService.clear(MEMBER_ID)

        // then
        verify { contactBlockRepository.deleteAllByMemberId(MEMBER_ID) }
    }

    companion object {

        private const val MEMBER_ID = 1L
    }
}
