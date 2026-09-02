package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.projection.MemberListRow
import com.blueoauld.server.domain.member.dto.response.MemberListItemResponse
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberListRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant

class MemberRankingServiceTest {

    private val memberListRepository = mockk<MemberListRepository>()

    private val memberSummaryService = mockk<MemberSummaryService>()

    private val service = MemberRankingService(memberListRepository, memberSummaryService)

    @BeforeEach
    fun setUp() {
        every { memberSummaryService.findListItems(ME_ID, any()) } answers {
            secondArg<List<MemberListRow>>().map(::item)
        }
    }

    @Test
    fun `좋아요 순으로 조회해 접속 시각과 함께 준다`() {
        // given
        every { memberListRepository.findByReceivedLikeCount(ME_ID, "FEMALE", null, null, null, 20) } returns
            listOf(row(2L, 7.0), row(3L, 3.0))

        // when
        val response = service.findRanking(ME_ID, Gender.FEMALE, null, 20)

        // then
        assertThat(response.items.map { it.memberId }).containsExactly(2L, 3L)
        assertThat(response.items.map { it.locatedAt }).containsExactly(LOCATED_AT, LOCATED_AT)
        assertThat(response.nextCursor).isNull()
    }

    @Test
    fun `페이지가 꽉 차면 좋아요 수, 접속 시각, id로 다음 커서를 만든다`() {
        // given
        every { memberListRepository.findByReceivedLikeCount(any(), any(), any(), any(), any(), 2) } returns
            listOf(row(2L, 7.0), row(3L, 3.0))

        // when
        val response = service.findRanking(ME_ID, null, null, 2)

        // then
        assertThat(response.nextCursor)
            .isEqualTo(MemberListCursor.encodeRanking(3L, LOCATED_AT.epochSecond, 3L))
    }

    @Test
    fun `커서를 풀어서 조회에 넘긴다`() {
        // given
        val cursor = MemberListCursor.encodeRanking(3L, LOCATED_AT.epochSecond, 3L)
        every { memberListRepository.findByReceivedLikeCount(any(), any(), any(), any(), any(), any()) } returns
            emptyList()

        // when
        service.findRanking(ME_ID, null, cursor, 20)

        // then
        verify { memberListRepository.findByReceivedLikeCount(ME_ID, null, 3L, LOCATED_AT.epochSecond, 3L, 20) }
    }

    private fun row(memberId: Long, likeCount: Double) = mockk<MemberListRow> {
        every { getMemberId() } returns memberId
        every { getOrderValue() } returns likeCount
        every { getLocatedAt() } returns LOCATED_AT
        every { getDistance() } returns null
        every { getFavoritedByMe() } returns false
    }

    private fun item(row: MemberListRow) = MemberListItemResponse.of(
        summary(row.getMemberId()),
        row.getLocatedAt(),
        row.getDistance(),
        row.getFavoritedByMe(),
    )

    private fun summary(memberId: Long) = MemberSummaryResponse(
        memberId = memberId,
        nickname = "회원$memberId",
        gender = Gender.FEMALE,
        age = 27,
        receivedLikeCount = 0,
        comment = null,
        profileImageUrl = null,
        memo = null,
    )

    companion object {

        private const val ME_ID = 1L
        private val LOCATED_AT: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
