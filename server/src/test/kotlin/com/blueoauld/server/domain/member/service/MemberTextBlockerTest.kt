package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.TextTarget
import com.blueoauld.server.domain.member.repository.MemberRepository
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.*

class MemberTextBlockerTest {

    private val memberRepository = mockk<MemberRepository>()

    private val memberTextBlocker = MemberTextBlocker(memberRepository)

    @Test
    fun `코멘트를 안내 문구로 가린다`() {
        // given
        val member = member()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)

        // when
        memberTextBlocker.block(MEMBER_ID, TextTarget.COMMENT)

        // then
        assertThat(member.comment).isEqualTo(Member.BLOCKED_TEXT)
        assertThat(member.bio).isEqualTo(BIO)
    }

    @Test
    fun `자기소개를 안내 문구로 가린다`() {
        // given
        val member = member()
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)

        // when
        memberTextBlocker.block(MEMBER_ID, TextTarget.BIO)

        // then
        assertThat(member.bio).isEqualTo(Member.BLOCKED_TEXT)
        assertThat(member.comment).isEqualTo(COMMENT)
    }

    @Test
    fun `없는 회원이면 아무것도 하지 않는다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when, then
        memberTextBlocker.block(MEMBER_ID, TextTarget.COMMENT)
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
