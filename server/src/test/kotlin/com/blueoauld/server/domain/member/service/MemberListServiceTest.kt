package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.projection.MemberListRow
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberSort
import com.blueoauld.server.domain.member.repository.MemberListRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.ScrollResponse
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

class MemberListServiceTest {

    private val memberListRepository = mockk<MemberListRepository>()

    private val memberRepository = mockk<MemberRepository>()

    private val memberSummaryService = mockk<MemberSummaryService>()

    private val service = MemberListService(memberListRepository, memberRepository, memberSummaryService)

    private val me = Member(
        phoneNumber = "01012345678",
        password = "encoded",
        gender = Gender.MALE,
        nickname = "나",
        birthYear = 1998,
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findById(ME_ID) } returns Optional.of(me)
        every { memberSummaryService.findSummaries(any()) } answers { firstArg<List<Long>>().map(::summary) }
    }

    @Test
    fun `위치가 없으면 거리순을 요청해도 최근순으로 준다`() {
        // given
        every { memberListRepository.findRecent(any(), any(), any(), any(), any(), any(), any()) } returns
            listOf(row(2L, 5.0))

        // when
        val response = service.findMembers(ME_ID, MemberSort.DISTANCE, null, null, 20)

        // then
        assertThat(response.items.map { it.memberId }).containsExactly(2L)
        verify(exactly = 0) { memberListRepository.findByDistance(any(), any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `위치가 있으면 거리순으로 조회한다`() {
        // given
        me.latitude = 37.5
        me.longitude = 127.0
        every { memberListRepository.findByDistance(any(), any(), 37.5, 127.0, any(), any(), any()) } returns
            listOf(row(2L, 120.0))

        // when
        val response = service.findMembers(ME_ID, MemberSort.DISTANCE, Gender.FEMALE, null, 20)

        // then
        assertThat(response.items.single().distance).isEqualTo(120.0)
        verify { memberListRepository.findByDistance(any(), "FEMALE", 37.5, 127.0, null, null, 20) }
    }

    @Test
    fun `페이지가 꽉 차면 마지막 행으로 다음 커서를 만든다`() {
        // given
        every { memberListRepository.findRecent(any(), any(), any(), any(), any(), any(), 2) } returns
            listOf(row(2L, 5.0), row(3L, 4.0))

        // when
        val response = service.findMembers(ME_ID, MemberSort.RECENT, null, null, 2)

        // then
        assertThat(response.nextCursor).isEqualTo(ScrollResponse.encode(4.0, 3L))
    }

    @Test
    fun `페이지가 덜 차면 다음 커서가 없다`() {
        // given
        every { memberListRepository.findRecent(any(), any(), any(), any(), any(), any(), 20) } returns
            listOf(row(2L, 5.0))

        // when
        val response = service.findMembers(ME_ID, MemberSort.RECENT, null, null, 20)

        // then
        assertThat(response.nextCursor).isNull()
    }

    @Test
    fun `커서를 풀어서 조회에 넘긴다`() {
        // given
        every { memberListRepository.findRecent(any(), any(), any(), any(), 4.0, 3L, any()) } returns emptyList()

        // when
        service.findMembers(ME_ID, MemberSort.RECENT, null, ScrollResponse.encode(4.0, 3L), 20)

        // then
        verify { memberListRepository.findRecent(me.id, null, null, null, 4.0, 3L, 20) }
    }

    @Test
    fun `요약을 못 만든 회원은 목록에서 뺀다`() {
        // given
        every { memberListRepository.findRecent(any(), any(), any(), any(), any(), any(), any()) } returns
            listOf(row(2L, 5.0), row(3L, 4.0))
        every { memberSummaryService.findSummaries(listOf(2L, 3L)) } returns listOf(summary(3L))

        // when
        val response = service.findMembers(ME_ID, MemberSort.RECENT, null, null, 20)

        // then
        assertThat(response.items.map { it.memberId }).containsExactly(3L)
    }

    @Test
    fun `없는 회원이면 조회할 수 없다`() {
        // given
        every { memberRepository.findById(ME_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            service.findMembers(ME_ID, MemberSort.RECENT, null, null, 20)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    private fun row(memberId: Long, orderValue: Double) = mockk<MemberListRow> {
        every { getMemberId() } returns memberId
        every { getOrderValue() } returns orderValue
        every { getLocatedAt() } returns LOCATED_AT
        every { getDistance() } returns orderValue
        every { getFavoritedByMe() } returns false
    }

    private fun summary(memberId: Long) = MemberSummaryResponse(
        memberId = memberId,
        nickname = "회원$memberId",
        gender = Gender.FEMALE,
        age = 27,
        receivedLikeCount = 0,
        comment = null,
        profileImageUrl = null,
    )

    companion object {

        private const val ME_ID = 1L
        private val LOCATED_AT: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
