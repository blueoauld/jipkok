package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.service.SolapiVerificationCodeSender.Companion.dialCodeOf
import com.blueoauld.server.domain.auth.service.SolapiVerificationCodeSender.Companion.nationalOf
import com.blueoauld.server.domain.member.entity.Member
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class SolapiVerificationCodeSenderTest {

    @Test
    fun `받는 나라의 국가 코드를 찾는다`() {
        // given, when, then
        assertThat(dialCodeOf("+821012345678")).isEqualTo("+82")
        assertThat(dialCodeOf("+819012345678")).isEqualTo("+81")
    }

    @Test
    fun `보낼 수 없는 나라는 국가 코드를 찾지 못한다`() {
        // given, when, then
        assertThat(dialCodeOf("+14155552671")).isNull()
    }

    @Test
    fun `국가 코드를 떼고 국내 표기로 되돌린다`() {
        // given, when, then
        assertThat(nationalOf("+821012345678", "+82")).isEqualTo("01012345678")
        assertThat(nationalOf("+819012345678", "+81")).isEqualTo("09012345678")
    }

    @Test
    fun `가입을 받는 번호는 모두 보낼 수 있다`() {
        // given
        val pattern = Regex(Member.PHONE_NUMBER_PATTERN)
        val numbers = listOf(
            "+821012345678",
            "+817012345678",
            "+818012345678",
            "+819012345678",
        )

        // when, then
        assertThat(numbers).allMatch { pattern.matches(it) }
        assertThat(numbers).allMatch { dialCodeOf(it) != null }
    }
}
