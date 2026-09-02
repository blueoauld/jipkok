package com.blueoauld.server.domain.member.entity

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource

class MemberNicknamePatternTest {

    @ParameterizedTest
    @ValueSource(
        strings = [
            "홍길동",
            "홍 길동",
            "홍  길동",
            "hong123",
            "ㅋㅋㅋ",
            "ㅏㅑㅓ",
            "さくら",
            "サクラ",
            "ユーカ",
            "田中太郎",
            "佐々木",
            "たなか123",
        ],
    )
    fun `허용하는 닉네임`(nickname: String) {
        // given, when
        val matches = nickname.matches(PATTERN)

        // then
        assertThat(matches).isTrue()
    }

    @ParameterizedTest
    @ValueSource(
        strings = [
            "홍\n길동",
            "홍\t길동",
            "홍 길동",
            "홍​길동",
            "​​",
            "ㅤㅤ",
            "홍길동😀",
            "홍길동!",
            "홍길동@",
            "ﾊﾝｶｸ",
        ],
    )
    fun `막아야 하는 닉네임`(nickname: String) {
        // given, when
        val matches = nickname.matches(PATTERN)

        // then
        assertThat(matches).isFalse()
    }

    companion object {

        private val PATTERN = Regex(Member.NICKNAME_PATTERN)
    }
}
