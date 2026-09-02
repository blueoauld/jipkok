package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.repository.MemberListRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class MemberSearchServiceTest {

    private val memberListRepository = mockk<MemberListRepository>(relaxed = true)

    private val memberSummaryService = mockk<MemberSummaryService>(relaxed = true)

    private val memberSearchService = MemberSearchService(memberListRepository, memberSummaryService)

    @BeforeEach
    fun setUp() {
        every { memberListRepository.findByNicknamePrefix(any(), any(), any(), any(), any()) } returns emptyList()
        every { memberSummaryService.findSummaries(MEMBER_ID, any()) } returns emptyList()
    }

    @Test
    fun `검색어가 한 자면 조회하지 않는다`() {
        // given
        // when
        val response = memberSearchService.searchByNickname(MEMBER_ID, "홍", null, PAGE_SIZE)

        // then
        assertThat(response.items).isEmpty()
        assertThat(response.nextCursor).isNull()
        verify(exactly = 0) { memberListRepository.findByNicknamePrefix(any(), any(), any(), any(), any()) }
    }

    @Test
    fun `앞뒤 공백을 뺀 길이로 판단한다`() {
        // given
        // when
        memberSearchService.searchByNickname(MEMBER_ID, "  홍  ", null, PAGE_SIZE)

        // then
        verify(exactly = 0) { memberListRepository.findByNicknamePrefix(any(), any(), any(), any(), any()) }
    }

    @Test
    fun `검색어가 두 자면 조회한다`() {
        // given
        val keyword = slot<String>()

        // when
        memberSearchService.searchByNickname(MEMBER_ID, " 홍길 ", null, PAGE_SIZE)

        // then
        verify { memberListRepository.findByNicknamePrefix(MEMBER_ID, capture(keyword), null, null, PAGE_SIZE) }
        assertThat(keyword.captured).isEqualTo("홍길")
    }

    @Test
    fun `와일드카드는 그대로 찾도록 이스케이프한다`() {
        // given
        val keyword = slot<String>()

        // when
        memberSearchService.searchByNickname(MEMBER_ID, "a%b", null, PAGE_SIZE)

        // then
        verify { memberListRepository.findByNicknamePrefix(MEMBER_ID, capture(keyword), null, null, PAGE_SIZE) }
        assertThat(keyword.captured).isEqualTo("""a\%b""")
    }

    companion object {

        private const val MEMBER_ID = 1L
        private const val PAGE_SIZE = 20
    }
}
