package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.member.entity.type.MemberLocale

// 회원의 언어 설정은 기기 언어라 실제로 주고받는 말과 다를 수 있어, 상대가 쓴 글자로 답할 언어를 고른다.
private const val MAX_MESSAGES = 5
private const val MIN_LATIN_LETTERS = 4
private const val SHARED_SCRIPTS = "\\p{sc=Latin}\\p{sc=Common}\\p{sc=Inherited}"

private val HANGUL = Regex("[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]")
private val KANA = Regex("[\u3040-\u30ff]")
private val HAN = Regex("[\u3400-\u4dbf\u4e00-\u9fff]")
private val LATIN = Regex("[A-Za-z]")
private val LATIN_WORD = Regex("[A-Za-z]{3,}")

private val REQUIRED = mapOf(
    MemberLocale.KO to HANGUL,
    MemberLocale.JA to KANA,
    MemberLocale.ZH_TW to HAN,
    MemberLocale.EN to LATIN,
)

private val FOREIGN = mapOf(
    MemberLocale.KO to Regex("[^\\p{sc=Hangul}$SHARED_SCRIPTS]"),
    MemberLocale.JA to Regex("[^\\p{sc=Hiragana}\\p{sc=Katakana}\\p{sc=Han}$SHARED_SCRIPTS]"),
    MemberLocale.ZH_TW to Regex("[^\\p{sc=Han}\\p{sc=Bopomofo}$SHARED_SCRIPTS]"),
    MemberLocale.EN to Regex("[^$SHARED_SCRIPTS]"),
)

// AI가 한 말은 이미 정해진 언어라 근거가 못 되므로 상대가 쓴 것만 본다.
fun detectLanguage(messages: List<ChatMessage>, aiMemberId: Long, fallback: MemberLocale): MemberLocale =
    detectLanguage(messages.filter { it.senderId != aiMemberId }.mapNotNull { it.content }, fallback)

fun detectLanguage(texts: List<String>, fallback: MemberLocale): MemberLocale {
    val text = texts.takeLast(MAX_MESSAGES).joinToString(" ")

    return when {
        HANGUL.containsMatchIn(text) -> MemberLocale.KO
        // 일본어는 한자를 섞어 쓰므로 가나를 먼저 본다.
        KANA.containsMatchIn(text) -> MemberLocale.JA
        HAN.containsMatchIn(text) -> MemberLocale.ZH_TW
        // 한두 글자짜리 영문은 다른 언어를 쓰는 사람도 흘리듯 쓴다.
        LATIN.findAll(text).count() >= MIN_LATIN_LETTERS -> MemberLocale.EN
        else -> fallback
    }
}

// 다른 언어의 글자가 섞였거나 그 언어의 글자가 아예 없으면 어긋난 답으로 본다.
fun matchesLanguage(text: String, language: MemberLocale): Boolean {
    if (foreignStart(text, language) != null) {
        return false
    }

    return REQUIRED.getValue(language).containsMatchIn(text) || !hasLetters(text)
}

fun cutAtForeign(text: String, language: MemberLocale): String? {
    val kept = foreignStart(text, language)?.let { text.substring(0, it).trim() } ?: text

    return kept.takeIf { REQUIRED.getValue(language).containsMatchIn(it) }
}

private fun foreignStart(text: String, language: MemberLocale): Int? =
    listOfNotNull(
        FOREIGN.getValue(language).find(text)?.range?.first,
        strayLatinWord(text, language)?.range?.first,
    ).minOrNull()

private fun strayLatinWord(text: String, language: MemberLocale): MatchResult? {
    if (language == MemberLocale.EN) {
        return null
    }

    return LATIN_WORD.findAll(text).firstOrNull { match -> match.value.any(Char::isLowerCase) }
}

private fun hasLetters(text: String) = REQUIRED.values.any { it.containsMatchIn(text) }
