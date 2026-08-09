package com.blueoauld.server.domain.profileview.service

import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.domain.profileview.entity.ProfileView
import com.blueoauld.server.domain.profileview.repository.ProfileViewRepository
import com.blueoauld.server.global.response.CursorResponse
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.data.domain.Limit
import java.time.Clock
import java.time.Instant
import java.time.ZoneId

class ProfileViewServiceTest {

    private val profileViewRepository = mockk<ProfileViewRepository>(relaxed = true)

    private val memberSummaryService = mockk<MemberSummaryService>(relaxed = true)

    private val clock = Clock.fixed(NOW, ZoneId.of("Asia/Seoul"))

    private val profileViewService = ProfileViewService(
        profileViewRepository,
        memberSummaryService,
        clock,
    )

    @BeforeEach
    fun setUp() {
        every { profileViewRepository.findByViewerIdAndViewedMemberId(any(), any()) } returns null
        every { profileViewRepository.saveAndFlush(any()) } answers { firstArg() }
    }

    @Test
    fun `처음 조회하면 기록을 남긴다`() {
        // given
        val saved = slot<ProfileView>()

        // when
        profileViewService.record(VIEWER_ID, VIEWED_MEMBER_ID)

        // then
        verify { profileViewRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.viewerId).isEqualTo(VIEWER_ID)
        assertThat(saved.captured.viewedMemberId).isEqualTo(VIEWED_MEMBER_ID)
        assertThat(saved.captured.viewedAt).isEqualTo(NOW)
    }

    @Test
    fun `이미 조회한 회원을 다시 보면 새로 쌓지 않고 조회 시각만 갱신한다`() {
        // given
        val view = ProfileView(VIEWER_ID, VIEWED_MEMBER_ID, NOW.minusSeconds(3600))
        every { profileViewRepository.findByViewerIdAndViewedMemberId(VIEWER_ID, VIEWED_MEMBER_ID) } returns view

        // when
        profileViewService.record(VIEWER_ID, VIEWED_MEMBER_ID)

        // then
        verify(exactly = 0) { profileViewRepository.saveAndFlush(any()) }
        assertThat(view.viewedAt).isEqualTo(NOW)
    }

    @Test
    fun `자기 자신을 조회하면 기록하지 않는다`() {
        // given

        // when
        profileViewService.record(VIEWER_ID, VIEWER_ID)

        // then
        verify(exactly = 0) { profileViewRepository.saveAndFlush(any()) }
        verify(exactly = 0) { profileViewRepository.findByViewerIdAndViewedMemberId(any(), any()) }
    }

    @Test
    fun `목록을 최근 조회순으로 주고 다음 커서를 만든다`() {
        // given
        val older = NOW.minusSeconds(60)
        every {
            profileViewRepository.findByViewedMemberIdOrderByViewedAtDescIdDesc(VIEWED_MEMBER_ID, any())
        } returns listOf(profileView(30L, VIEWER_ID, NOW), profileView(20L, 3L, older))
        every { memberSummaryService.findSummaries(listOf(VIEWER_ID, 3L)) } returns
                listOf(summary(VIEWER_ID), summary(3L))

        // when
        val response = profileViewService.findViewers(VIEWED_MEMBER_ID, null, 2)

        // then
        assertThat(response.items).extracting("memberId").containsExactly(VIEWER_ID, 3L)
        assertThat(response.nextCursor).isEqualTo("${older.toEpochMilli()}:20")
    }

    @Test
    fun `마지막 쪽이면 다음 커서를 주지 않는다`() {
        // given
        every {
            profileViewRepository.findByViewedMemberIdOrderByViewedAtDescIdDesc(VIEWED_MEMBER_ID, any())
        } returns listOf(profileView(30L, VIEWER_ID, NOW))

        // when
        val response = profileViewService.findViewers(VIEWED_MEMBER_ID, null, 2)

        // then
        assertThat(response.nextCursor).isNull()
    }

    @Test
    fun `커서를 주면 그 뒤부터 조회한다`() {
        // given
        val cursor = "${NOW.toEpochMilli()}:30"
        every { profileViewRepository.findNextPage(any(), any(), any(), any()) } returns emptyList()

        // when
        profileViewService.findViewers(VIEWED_MEMBER_ID, cursor, 20)

        // then
        verify { profileViewRepository.findNextPage(VIEWED_MEMBER_ID, NOW, 30L, any()) }
        verify(exactly = 0) {
            profileViewRepository.findByViewedMemberIdOrderByViewedAtDescIdDesc(any(), any())
        }
    }

    @Test
    fun `망가진 커서는 첫 쪽으로 본다`() {
        // given
        every {
            profileViewRepository.findByViewedMemberIdOrderByViewedAtDescIdDesc(VIEWED_MEMBER_ID, any())
        } returns emptyList()

        // when
        profileViewService.findViewers(VIEWED_MEMBER_ID, "깨진커서", 20)

        // then
        verify { profileViewRepository.findByViewedMemberIdOrderByViewedAtDescIdDesc(VIEWED_MEMBER_ID, any()) }
        verify(exactly = 0) { profileViewRepository.findNextPage(any(), any(), any(), any()) }
    }

    @Test
    fun `요청한 크기가 상한을 넘으면 상한으로 자른다`() {
        // given
        val limit = slot<Limit>()
        every {
            profileViewRepository.findByViewedMemberIdOrderByViewedAtDescIdDesc(VIEWED_MEMBER_ID, capture(limit))
        } returns emptyList()

        // when
        profileViewService.findViewers(VIEWED_MEMBER_ID, null, 1000)

        // then
        assertThat(limit.captured.max()).isEqualTo(CursorResponse.MAX_PAGE_SIZE)
    }

    private fun profileView(id: Long, viewerId: Long, viewedAt: Instant) = mockk<ProfileView>(relaxed = true) {
        every { this@mockk.id } returns id
        every { this@mockk.viewerId } returns viewerId
        every { this@mockk.viewedAt } returns viewedAt
    }

    private fun summary(memberId: Long) = MemberSummaryResponse(
        memberId = memberId,
        nickname = "닉네임",
        gender = Gender.MALE,
        age = 28,
        receivedLikeCount = 0,
        comment = null,
        profileImageUrl = null,
    )

    companion object {

        private const val VIEWER_ID = 1L
        private const val VIEWED_MEMBER_ID = 2L

        private val NOW: Instant = Instant.parse("2026-08-09T00:00:00Z")
    }
}
