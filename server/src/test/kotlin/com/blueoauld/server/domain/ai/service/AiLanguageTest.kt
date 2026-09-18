package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AiLanguageTest {

    @Test
    fun `상대가 쓴 글자로 언어를 고른다`() {
        // when, then
        assertThat(detectLanguage(listOf("오늘 뭐 했어요?"), MemberLocale.EN)).isEqualTo(MemberLocale.KO)
        assertThat(detectLanguage(listOf("今日は何をしましたか"), MemberLocale.KO)).isEqualTo(MemberLocale.JA)
        assertThat(detectLanguage(listOf("今天過得如何"), MemberLocale.KO)).isEqualTo(MemberLocale.ZH_TW)
        assertThat(detectLanguage(listOf("how was your day"), MemberLocale.KO)).isEqualTo(MemberLocale.EN)
    }

    @Test
    fun `한자를 섞은 일본어는 가나를 보고 일본어로 본다`() {
        // when, then
        assertThat(detectLanguage(listOf("今日は暑いですね"), MemberLocale.KO)).isEqualTo(MemberLocale.JA)
    }

    @Test
    fun `글자가 없거나 영문이 몇 자뿐이면 계정 언어를 쓴다`() {
        // when, then
        assertThat(detectLanguage(listOf("ㅋㅋ"), MemberLocale.EN)).isEqualTo(MemberLocale.KO)
        assertThat(detectLanguage(listOf("ok"), MemberLocale.KO)).isEqualTo(MemberLocale.KO)
        assertThat(detectLanguage(listOf("😀"), MemberLocale.JA)).isEqualTo(MemberLocale.JA)
        assertThat(detectLanguage(emptyList(), MemberLocale.ZH_TW)).isEqualTo(MemberLocale.ZH_TW)
    }

    @Test
    fun `여러 메시지 중 최근 것만 본다`() {
        // given
        val texts = List(MAX_MESSAGES_IN_TEST) { "hello there" } + "한국어로 바꿨어요"

        // when, then
        assertThat(detectLanguage(texts, MemberLocale.EN)).isEqualTo(MemberLocale.KO)
    }

    @Test
    fun `기대한 언어의 글자가 있고 다른 언어 글자가 없어야 맞는 답이다`() {
        // when, then
        assertThat(matchesLanguage("오늘 날씨 좋네요", MemberLocale.KO)).isTrue()
        assertThat(matchesLanguage("오늘 日氣가 좋네요", MemberLocale.KO)).isFalse()
        assertThat(matchesLanguage("Sounds good!", MemberLocale.KO)).isFalse()
        assertThat(matchesLanguage("そうですね", MemberLocale.JA)).isTrue()
        assertThat(matchesLanguage("今日はいい天気ですね", MemberLocale.JA)).isTrue()
        assertThat(matchesLanguage("好的, 我明白了", MemberLocale.ZH_TW)).isTrue()
        assertThat(matchesLanguage("Sounds good!", MemberLocale.EN)).isTrue()
        assertThat(matchesLanguage("좋아요 sounds good", MemberLocale.EN)).isFalse()
    }

    @Test
    fun `글자가 없는 답은 언어를 따지지 않는다`() {
        // when, then
        assertThat(matchesLanguage("😀😀", MemberLocale.KO)).isTrue()
        assertThat(matchesLanguage("!!!", MemberLocale.JA)).isTrue()
    }

    companion object {

        private const val MAX_MESSAGES_IN_TEST = 5
    }
}
