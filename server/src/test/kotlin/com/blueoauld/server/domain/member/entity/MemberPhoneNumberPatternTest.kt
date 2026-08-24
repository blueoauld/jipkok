package com.blueoauld.server.domain.member.entity

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class MemberPhoneNumberPatternTest {

    private val pattern = Regex(Member.PHONE_NUMBER_PATTERN)

    @Test
    fun `국가 코드가 붙은 한국 휴대폰 번호를 받는다`() {
        // given, when, then
        assertThat(pattern.matches("+821012345678")).isTrue()
    }

    @Test
    fun `국가 코드가 붙은 일본 휴대폰 번호를 받는다`() {
        // given, when
        val numbers = listOf("+817012345678", "+818012345678", "+819012345678")

        // then
        assertThat(numbers).allMatch { pattern.matches(it) }
    }

    @Test
    fun `국가 코드가 붙은 대만 휴대폰 번호를 받는다`() {
        // given, when, then
        assertThat(pattern.matches("+886912345678")).isTrue()
    }

    @Test
    fun `국가 코드가 없으면 받지 않는다`() {
        // given, when
        val numbers = listOf("01012345678", "09012345678")

        // then
        assertThat(numbers).noneMatch { pattern.matches(it) }
    }

    @Test
    fun `열지 않은 나라는 받지 않는다`() {
        // given, when
        val numbers = listOf("+14155552671", "+8613912345678")

        // then
        assertThat(numbers).noneMatch { pattern.matches(it) }
    }

    @Test
    fun `자릿수가 어긋나면 받지 않는다`() {
        // given, when
        val numbers = listOf("+82101234567", "+8210123456789", "+81901234567", "+88691234567")

        // then
        assertThat(numbers).noneMatch { pattern.matches(it) }
    }

    @Test
    fun `일본 휴대폰이 아닌 앞자리는 받지 않는다`() {
        // given, when, then
        assertThat(pattern.matches("+816012345678")).isFalse()
    }

    @Test
    fun `대만 휴대폰이 아닌 앞자리는 받지 않는다`() {
        // given, when, then
        assertThat(pattern.matches("+886812345678")).isFalse()
    }
}
