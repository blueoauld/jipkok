package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.domain.photo.event.PhotosDeletedEvent
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import io.mockk.verifyOrder
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class MemberCleanerTest {

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val memberPhotoRepository = mockk<MemberPhotoRepository>(relaxed = true)

    private val nicknameHistoryRepository = mockk<NicknameHistoryRepository>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val cleaner = MemberCleaner(
        memberRepository,
        memberPhotoRepository,
        nicknameHistoryRepository,
        eventPublisher,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findIdsDeletedBefore(any()) } returns MEMBER_IDS
        every { memberPhotoRepository.findAllByMemberIdIn(MEMBER_IDS) } returns listOf(
            MemberPhoto(10L, PhotoVisibility.PUBLIC, 0, "members/10/public/a.jpg"),
            MemberPhoto(11L, PhotoVisibility.SECRET, 0, "members/11/secret/b.jpg"),
        )
    }

    @Test
    fun `보관 기간이 지난 탈퇴 회원은 사진, 닉네임 이력, 회원 행을 지운다`() {
        // when
        cleaner.cleanUpWithdrawnMembers()

        // then
        verify { memberRepository.findIdsDeletedBefore(NOW.minus(MemberCleaner.RETENTION)) }
        verifyOrder {
            memberPhotoRepository.deleteAllByMemberIdIn(MEMBER_IDS)
            nicknameHistoryRepository.deleteAllByMemberIdIn(MEMBER_IDS)
            memberRepository.deleteAllByIdIn(MEMBER_IDS)
            eventPublisher.publishEvent(
                PhotosDeletedEvent(listOf("members/10/public/a.jpg", "members/11/secret/b.jpg")),
            )
        }
    }

    @Test
    fun `사진이 없으면 삭제 이벤트를 내지 않는다`() {
        // given
        every { memberPhotoRepository.findAllByMemberIdIn(MEMBER_IDS) } returns emptyList()

        // when
        cleaner.cleanUpWithdrawnMembers()

        // then
        verify(exactly = 0) { eventPublisher.publishEvent(any()) }
    }

    @Test
    fun `지울 회원이 없으면 아무것도 하지 않는다`() {
        // given
        every { memberRepository.findIdsDeletedBefore(any()) } returns emptyList()

        // when
        cleaner.cleanUpWithdrawnMembers()

        // then
        verify(exactly = 0) { memberRepository.deleteAllByIdIn(any()) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-02T05:00:00Z")

        private val MEMBER_IDS = listOf(10L, 11L)
    }
}
