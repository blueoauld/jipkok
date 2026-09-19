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

    @Test
    fun `그 언어가 쓰지 않는 문자가 섞이면 어긋난 답이다`() {
        // when, then
        assertThat(matchesLanguage("주로 뭐 봐? કામ", MemberLocale.KO)).isFalse()
        assertThat(matchesLanguage("좋은 오후 보내세요 ងៃ", MemberLocale.KO)).isFalse()
        assertThat(matchesLanguage("そうですね ㅋㅋ", MemberLocale.JA)).isFalse()
        assertThat(matchesLanguage("Sounds good! જરૂર", MemberLocale.EN)).isFalse()
    }

    @Test
    fun `영어가 아닌 답에 소문자가 든 세 글자 이상 영단어가 있으면 어긋난 답이다`() {
        // when, then
        assertThat(matchesLanguage("나 이제 수업 들어가야 돼!anngilaq", MemberLocale.KO)).isFalse()
        assertThat(matchesLanguage("푹 쉬세요. Fever?", MemberLocale.KO)).isFalse()
        assertThat(matchesLanguage("今日は暑いですね hopefully", MemberLocale.JA)).isFalse()
    }

    @Test
    fun `대문자 약어, 두 글자 영문, 이모지는 섞여도 된다`() {
        // when, then
        assertThat(matchesLanguage("MBTI는 INFP야 ㅋㅋ", MemberLocale.KO)).isTrue()
        assertThat(matchesLanguage("야식 금지 vs 배달 금지", MemberLocale.KO)).isTrue()
        assertThat(matchesLanguage("좋아요 ❤️👍🏻", MemberLocale.KO)).isTrue()
        assertThat(matchesLanguage("ラーメン食べたい", MemberLocale.JA)).isTrue()
    }

    @Test
    fun `다른 언어가 처음 나온 곳에서 잘라 앞부분만 남긴다`() {
        // when, then
        assertThat(cutAtForeign("아 지금은 뭐 하고 있어요? કામ?", MemberLocale.KO)).isEqualTo("아 지금은 뭐 하고 있어요?")
        assertThat(cutAtForeign("나 이제 수업 들어가야 돼!anngilaq", MemberLocale.KO)).isEqualTo("나 이제 수업 들어가야 돼!")
        assertThat(cutAtForeign("편하게 쉬세요. Later today hopefully feeling better.", MemberLocale.KO))
            .isEqualTo("편하게 쉬세요.")
        assertThat(cutAtForeign("장난 많이 치는 편이에요 马会", MemberLocale.KO)).isEqualTo("장난 많이 치는 편이에요")
    }

    @Test
    fun `잘라 낸 앞부분에 그 언어 글자가 없으면 버린다`() {
        // when, then
        assertThat(cutAtForeign("Hello ㅋㅋ nice to meet you", MemberLocale.KO)).isNull()
        assertThat(cutAtForeign("OK MBTI", MemberLocale.KO)).isNull()
    }

    companion object {

        private const val MAX_MESSAGES_IN_TEST = 5
    }
}
