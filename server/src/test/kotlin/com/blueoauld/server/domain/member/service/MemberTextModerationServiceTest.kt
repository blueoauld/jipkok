package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.ModerationCategory
import com.blueoauld.server.domain.member.entity.type.TextTarget
import com.blueoauld.server.domain.member.event.MemberTextBlockedEvent
import com.blueoauld.server.domain.member.event.MemberTextChangedEvent
import com.blueoauld.server.domain.member.repository.MemberRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import io.mockk.verifyOrder
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.util.*

class MemberTextModerationServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val memberTextBlocker = mockk<MemberTextBlocker>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val textModerator = mockk<TextModerator>()

    private val service = MemberTextModerationService(
        memberRepository,
        memberTextBlocker,
        eventPublisher,
        textModerator,
    )

    @Test
    fun `부적절한 글은 가리고 분류와 함께 알린다`() {
        // given
        val blocked = slot<MemberTextBlockedEvent>()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { textModerator.moderate(COMMENT) } returns ModerationResult(true, ModerationCategory.ABUSE)
        every { textModerator.moderate(BIO) } returns ModerationResult.PASSED
        every { memberTextBlocker.block(MEMBER_ID, TextTarget.COMMENT, COMMENT) } returns true
        every { eventPublisher.publishEvent(capture(blocked)) } returns Unit

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        verify { memberTextBlocker.block(MEMBER_ID, TextTarget.COMMENT, COMMENT) }
        verify(exactly = 0) { memberTextBlocker.block(MEMBER_ID, TextTarget.BIO, any()) }
        assertThat(blocked.captured.field).isEqualTo(TextTarget.COMMENT.label)
        assertThat(blocked.captured.category).isEqualTo(ModerationCategory.ABUSE)
        assertThat(blocked.captured.text).isEqualTo(COMMENT)
    }

    @Test
    fun `가리는 일은 검수를 마친 뒤에 한다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { textModerator.moderate(COMMENT) } returns ModerationResult(true, ModerationCategory.ABUSE)
        every { textModerator.moderate(BIO) } returns ModerationResult.PASSED

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        verifyOrder {
            textModerator.moderate(COMMENT)
            memberTextBlocker.block(MEMBER_ID, TextTarget.COMMENT, COMMENT)
        }
    }

    @Test
    fun `검수하는 사이 글이 바뀌어 가리지 못했으면 알리지 않는다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { textModerator.moderate(COMMENT) } returns ModerationResult(true, ModerationCategory.ABUSE)
        every { textModerator.moderate(BIO) } returns ModerationResult.PASSED
        every { memberTextBlocker.block(MEMBER_ID, TextTarget.COMMENT, COMMENT) } returns false

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        verify(exactly = 0) { eventPublisher.publishEvent(any<MemberTextBlockedEvent>()) }
    }

    @Test
    fun `이미 가려진 글은 다시 검수하지 않는다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns
            Optional.of(member().apply { comment = Member.BLOCKED_TEXT })
        every { textModerator.moderate(BIO) } returns ModerationResult.PASSED

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        verify(exactly = 0) { textModerator.moderate(Member.BLOCKED_TEXT) }
        verify(exactly = 0) { memberTextBlocker.block(any(), any(), any()) }
        verify(exactly = 0) { eventPublisher.publishEvent(ofType<MemberTextBlockedEvent>()) }
    }

    @Test
    fun `문제 없는 글은 그대로 두고 알리지 않는다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { textModerator.moderate(any()) } returns ModerationResult.PASSED

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        verify(exactly = 0) { memberTextBlocker.block(any(), any(), any()) }
        verify(exactly = 0) { eventPublisher.publishEvent(ofType<MemberTextBlockedEvent>()) }
    }

    @Test
    fun `검수에 실패하면 글을 건드리지 않는다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { textModerator.moderate(any()) } throws RuntimeException("호출 실패")

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        verify(exactly = 0) { memberTextBlocker.block(any(), any(), any()) }
    }

    @Test
    fun `비어 있는 글은 검수하지 않는다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member().apply { comment = null })
        every { textModerator.moderate(BIO) } returns ModerationResult.PASSED

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        verify(exactly = 0) { textModerator.moderate(COMMENT) }
    }

    private fun member() = Member(
        phoneNumber = "+821012345678",
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "닉네임",
        birthYear = 1998,
        comment = COMMENT,
        bio = BIO,
    )

    companion object {

        private const val MEMBER_ID = 1L
        private const val COMMENT = "같이 커피 마셔요"
        private const val BIO = "주말엔 카페에 자주 갑니다."
    }
}
