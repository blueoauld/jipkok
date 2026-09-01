package com.blueoauld.server.domain.favorite.service

import com.blueoauld.server.domain.favorite.entity.MemberFavorite
import com.blueoauld.server.domain.favorite.repository.MemberFavoriteRepository
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.service.MemberSummaryService
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

class MemberFavoriteServiceTest {

    private val memberFavoriteRepository = mockk<MemberFavoriteRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val memberSummaryService = mockk<MemberSummaryService>(relaxed = true)

    private val memberFavoriteService = MemberFavoriteService(
        memberFavoriteRepository,
        memberRepository,
        memberSummaryService,
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.existsById(FAVORITE_MEMBER_ID) } returns true
        every { memberFavoriteRepository.existsByMemberIdAndFavoriteMemberId(any(), any()) } returns false
        every { memberFavoriteRepository.saveAndFlush(any()) } answers { firstArg() }
    }

    @Test
    fun `즐겨찾기를 추가하면 기록을 남긴다`() {
        // given
        val saved = slot<MemberFavorite>()

        // when
        memberFavoriteService.add(MEMBER_ID, FAVORITE_MEMBER_ID)

        // then
        verify { memberFavoriteRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.memberId).isEqualTo(MEMBER_ID)
        assertThat(saved.captured.favoriteMemberId).isEqualTo(FAVORITE_MEMBER_ID)
    }

    @Test
    fun `이미 추가한 즐겨찾기를 또 추가해도 기록이 늘지 않는다`() {
        // given
        every {
            memberFavoriteRepository.existsByMemberIdAndFavoriteMemberId(MEMBER_ID, FAVORITE_MEMBER_ID)
        } returns true

        // when
        memberFavoriteService.add(MEMBER_ID, FAVORITE_MEMBER_ID)

        // then
        verify(exactly = 0) { memberFavoriteRepository.saveAndFlush(any()) }
    }

    @Test
    fun `자기 자신은 즐겨찾기할 수 없다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberFavoriteService.add(MEMBER_ID, MEMBER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_FAVORITE)
        verify(exactly = 0) { memberFavoriteRepository.saveAndFlush(any()) }
    }

    @Test
    fun `없는 회원은 즐겨찾기할 수 없다`() {
        // given
        every { memberRepository.existsById(FAVORITE_MEMBER_ID) } returns false

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberFavoriteService.add(MEMBER_ID, FAVORITE_MEMBER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
        verify(exactly = 0) { memberFavoriteRepository.saveAndFlush(any()) }
    }

    @Test
    fun `즐겨찾기를 해제하면 기록을 지운다`() {
        // given

        // when
        memberFavoriteService.remove(MEMBER_ID, FAVORITE_MEMBER_ID)

        // then
        verify { memberFavoriteRepository.deleteByMemberIdAndFavoriteMemberId(MEMBER_ID, FAVORITE_MEMBER_ID) }
    }

    @Test
    fun `즐겨찾기 목록을 커서 순서대로 준다`() {
        // given
        val favorites = listOf(favorite(30L, FAVORITE_MEMBER_ID), favorite(20L, 3L))
        every {
            memberFavoriteRepository.findByMemberIdAndIdLessThanOrderByIdDesc(MEMBER_ID, Long.MAX_VALUE, any())
        } returns favorites
        every { memberSummaryService.findSummaries(any(), listOf(FAVORITE_MEMBER_ID, 3L)) } returns
            listOf(summary(FAVORITE_MEMBER_ID), summary(3L))

        // when
        val response = memberFavoriteService.findFavorites(MEMBER_ID, null, 2)

        // then
        assertThat(response.items).extracting("memberId").containsExactly(FAVORITE_MEMBER_ID, 3L)
        assertThat(response.nextCursor).isEqualTo(20L)
    }

    @Test
    fun `받은 즐겨찾기 목록은 추가한 사람을 준다`() {
        // given
        every {
            memberFavoriteRepository.findByFavoriteMemberIdAndIdLessThanOrderByIdDesc(FAVORITE_MEMBER_ID, 40L, any())
        } returns listOf(favorite(30L, FAVORITE_MEMBER_ID))

        // when
        memberFavoriteService.findReceived(FAVORITE_MEMBER_ID, 40L, 20)

        // then
        verify { memberSummaryService.findSummaries(any(), listOf(MEMBER_ID)) }
    }

    private fun favorite(id: Long, favoriteMemberId: Long) = mockk<MemberFavorite>(relaxed = true) {
        every { this@mockk.id } returns id
        every { memberId } returns MEMBER_ID
        every { this@mockk.favoriteMemberId } returns favoriteMemberId
    }

    private fun summary(memberId: Long) = MemberSummaryResponse(
        memberId = memberId,
        nickname = "닉네임",
        gender = Gender.MALE,
        age = 28,
        receivedLikeCount = 0,
        comment = null,
        profileImageUrl = null,
        memo = null,
    )

    companion object {

        private const val MEMBER_ID = 1L
        private const val FAVORITE_MEMBER_ID = 2L
    }
}
