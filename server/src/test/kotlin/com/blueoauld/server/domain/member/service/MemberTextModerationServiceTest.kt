package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.ModerationCategory
import com.blueoauld.server.domain.member.event.MemberTextBlockedEvent
import com.blueoauld.server.domain.member.event.MemberTextChangedEvent
import com.blueoauld.server.domain.member.repository.MemberRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.util.*

class MemberTextModerationServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val textModerator = mockk<TextModerator>()

    private val service = MemberTextModerationService(memberRepository, eventPublisher, textModerator)

    @Test
    fun `부적절한 글은 가리고 분류와 함께 알린다`() {
        // given
        val member = member()
        val blocked = slot<MemberTextBlockedEvent>()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        every { textModerator.moderate(COMMENT) } returns
                ModerationResult(true, ModerationCategory.CONTACT)
        every { textModerator.moderate(BIO) } returns ModerationResult.PASSED
        every { eventPublisher.publishEvent(capture(blocked)) } returns Unit

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        assertThat(member.commentBlocked).isTrue()
        assertThat(member.bioBlocked).isFalse()
        assertThat(member.comment).isEqualTo(COMMENT)
        assertThat(member.visibleComment).isEqualTo(Member.BLOCKED_TEXT)
        assertThat(member.visibleBio).isEqualTo(BIO)

        assertThat(blocked.captured.field).isEqualTo("코멘트")
        assertThat(blocked.captured.category).isEqualTo(ModerationCategory.CONTACT)
        assertThat(blocked.captured.text).isEqualTo(COMMENT)
    }

    @Test
    fun `문제 없는 글은 그대로 보이고 알리지 않는다`() {
        // given
        val member = member()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        every { textModerator.moderate(any()) } returns ModerationResult.PASSED

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        assertThat(member.commentBlocked).isFalse()
        assertThat(member.visibleComment).isEqualTo(COMMENT)
        verify(exactly = 0) { eventPublisher.publishEvent(ofType<MemberTextBlockedEvent>()) }
    }

    @Test
    fun `검수에 실패하면 가리지 않는다`() {
        // given
        val member = member()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        every { textModerator.moderate(any()) } throws RuntimeException("호출 실패")

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        assertThat(member.commentBlocked).isFalse()
        assertThat(member.bioBlocked).isFalse()
        assertThat(member.visibleComment).isEqualTo(COMMENT)
    }

    @Test
    fun `검수기가 없으면 아무것도 하지 않는다`() {
        // given
        val member = member()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)

        // when
        MemberTextModerationService(memberRepository, eventPublisher, null)
            .moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        assertThat(member.commentBlocked).isFalse()
        assertThat(member.visibleComment).isEqualTo(COMMENT)
    }

    @Test
    fun `비어 있는 글은 검수하지 않는다`() {
        // given
        val member = member().apply { comment = null }
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        every { textModerator.moderate(BIO) } returns ModerationResult.PASSED

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        verify(exactly = 0) { textModerator.moderate(COMMENT) }
        assertThat(member.commentBlocked).isFalse()
    }

    private fun member() = Member(
        phoneNumber = "01012345678",
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
