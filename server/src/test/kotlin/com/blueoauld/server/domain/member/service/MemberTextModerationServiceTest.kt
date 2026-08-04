package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.event.MemberTextChangedEvent
import com.blueoauld.server.domain.member.repository.MemberRepository
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.*

class MemberTextModerationServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val textModerator = mockk<TextModerator>()

    private val service = MemberTextModerationService(memberRepository, textModerator)

    @Test
    fun `부적절한 글은 가려진다`() {
        // given
        val member = member()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        every { textModerator.isInappropriate(any()) } returns true

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        assertThat(member.commentBlocked).isTrue()
        assertThat(member.bioBlocked).isTrue()
        assertThat(member.comment).isEqualTo(COMMENT)
        assertThat(member.visibleComment).isEqualTo(Member.BLOCKED_TEXT)
        assertThat(member.visibleBio).isEqualTo(Member.BLOCKED_TEXT)
    }

    @Test
    fun `문제 없는 글은 그대로 보인다`() {
        // given
        val member = member()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        every { textModerator.isInappropriate(any()) } returns false

        // when
        service.moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        assertThat(member.commentBlocked).isFalse()
        assertThat(member.visibleComment).isEqualTo(COMMENT)
        assertThat(member.visibleBio).isEqualTo(BIO)
    }

    @Test
    fun `검수에 실패하면 가리지 않는다`() {
        // given
        val member = member()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        every { textModerator.isInappropriate(any()) } throws RuntimeException("호출 실패")

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
        MemberTextModerationService(memberRepository, null).moderate(MemberTextChangedEvent(MEMBER_ID))

        // then
        assertThat(member.commentBlocked).isFalse()
        assertThat(member.visibleComment).isEqualTo(COMMENT)
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
