package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.member.entity.type.MemberLocale

// 회원의 언어 설정은 기기 언어라 실제로 주고받는 말과 다를 수 있어, 상대가 쓴 글자로 답할 언어를 고른다.
private const val MAX_MESSAGES = 5
private const val MIN_LATIN_LETTERS = 4

private val HANGUL = Regex("[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]")
private val KANA = Regex("[\u3040-\u30ff]")
private val HAN = Regex("[\u3400-\u4dbf\u4e00-\u9fff]")
private val LATIN = Regex("[A-Za-z]")

private val REQUIRED = mapOf(
    MemberLocale.KO to HANGUL,
    MemberLocale.JA to KANA,
    MemberLocale.ZH_TW to HAN,
    MemberLocale.EN to LATIN,
)

private val FORBIDDEN = mapOf(
    MemberLocale.KO to listOf(KANA, HAN),
    MemberLocale.JA to listOf(HANGUL),
    MemberLocale.ZH_TW to listOf(HANGUL, KANA),
    MemberLocale.EN to listOf(HANGUL, KANA, HAN),
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
    if (FORBIDDEN.getValue(language).any { it.containsMatchIn(text) }) {
        return false
    }

    return REQUIRED.getValue(language).containsMatchIn(text) || !hasLetters(text)
}

private fun hasLetters(text: String) = REQUIRED.values.any { it.containsMatchIn(text) }
