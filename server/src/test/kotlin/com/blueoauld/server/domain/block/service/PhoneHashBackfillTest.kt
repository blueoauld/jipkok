package com.blueoauld.server.domain.block.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.properties.ContactBlockProperties
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class PhoneHashBackfillTest {

    private val memberRepository = mockk<MemberRepository>()

    private val phoneHasher = PhoneHasher(ContactBlockProperties("secret"))

    private val phoneHashBackfill = PhoneHashBackfill(memberRepository, phoneHasher)

    @Test
    fun `해시가 비어 있는 회원을 배치로 채우고 남는 회원이 없을 때 멈춘다`() {
        // given
        val first = member("+821011110000")
        val second = member("+821022220000")
        every { memberRepository.findAllByPhoneHashIsNull(any()) } returnsMany listOf(
            listOf(first),
            listOf(second),
            emptyList(),
        )

        // when
        phoneHashBackfill.backfill()

        // then
        assertThat(first.phoneHash).isEqualTo(phoneHasher.hash("+821011110000"))
        assertThat(second.phoneHash).isEqualTo(phoneHasher.hash("+821022220000"))
    }

    private fun member(phoneNumber: String) = Member(
        phoneNumber = phoneNumber,
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "닉네임",
        birthYear = 1998,
    )
}
