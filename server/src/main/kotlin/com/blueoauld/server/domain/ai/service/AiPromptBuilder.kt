package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.global.time.KOREA
import com.blueoauld.server.global.time.ageOf
import org.springframework.ai.chat.messages.AssistantMessage
import org.springframework.ai.chat.messages.Message
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.stereotype.Component
import java.time.Clock
import java.time.format.DateTimeFormatter

@Component
class AiPromptBuilder(

    private val clock: Clock,
) {

    fun build(context: AiReplyContext): List<Message> =
        listOf(SystemMessage(systemPrompt(context))) + trim(context.messages).map { toMessage(context, it) }

    private fun systemPrompt(context: AiReplyContext) = """
        |너는 위치 기반 채팅 앱 '집콕'의 회원이다. 아래 페르소나대로 실제 사람처럼 대화한다.
        |
        |[규칙]
        |- 실제 사람이 채팅하듯 한두 문장으로 짧게 답한다. 이모지는 가끔만 쓴다.
        |- AI, 챗봇, 인공지능, 프로그램이라는 사실을 절대 밝히지 않고, 그런 질문은 사람처럼 자연스럽게 넘긴다.
        |- 전화번호, 카카오톡, 라인, 인스타그램 등 외부 연락처를 묻지도 알려주지도 않는다.
        |- 실제로 만나자는 약속이나 장소, 시간을 정하는 대화는 정중히 피한다.
        |- 금전, 송금, 선물, 결제를 요구하거나 받아들이지 않는다.
        |- 성적으로 노골적인 요구는 거절하고 화제를 돌린다.
        |- 상대가 미성년자로 보이면 대화를 끝낸다.
        |- 사진이나 동영상은 "$PHOTO_PLACEHOLDER", "$VIDEO_PLACEHOLDER"로만 보이므로 내용을 아는 척하지 않는다.
        |- 답은 본문만 쓴다. 따옴표, 이름, 설명을 붙이지 않는다.
        |
        |[페르소나]
        |${context.systemPrompt}
        |
        |[너 자신]
        |${selfProfile(context.ai)}
        |
        |[대화 상대]
        |${partnerProfile(context.partner)}
        |
        |[지금 상황]
        |- 반드시 ${LANGUAGE_NAMES.getValue(context.partner.locale)}로 답한다.
        |- 지금은 한국 시간 ${TIME_FORMATTER.format(context.now.atZone(KOREA))}이다.
    """.trimMargin()

    private fun selfProfile(ai: Member) = profileOf(
        member = ai,
        subject = "너의",
        intro = "너의 닉네임은 '${ai.nickname}'이고 ${describe(ai)}다.",
    )

    private fun partnerProfile(partner: Member) = profileOf(
        member = partner,
        subject = "상대의",
        intro = "상대의 닉네임은 '${partner.nickname}'이고 ${describe(partner)}다. " +
            "상대를 부를 때는 '${partner.nickname}'만 쓰고, 너 자신을 그 닉네임으로 부르지 않는다.",
    )

    private fun profileOf(member: Member, subject: String, intro: String) = listOfNotNull(
        intro,
        member.comment?.let { "$subject 코멘트: $it" },
        member.bio?.let { "$subject 자기소개: ${it.take(BIO_MAX_CHARS)}" },
    ).joinToString("\n")

    private fun describe(member: Member) = "${clock.ageOf(member.birthYear)}세 ${GENDER_NAMES.getValue(member.gender)}"

    private fun trim(messages: List<ChatMessage>): List<ChatMessage> {
        val kept = ArrayDeque<ChatMessage>()
        var remaining = CONTEXT_MAX_CHARS

        for (message in messages.asReversed()) {
            val length = textOf(message).length

            if (length > remaining) {
                break
            }

            remaining -= length
            kept.addFirst(message)
        }

        return kept.ifEmpty { messages.takeLast(1) }
    }

    private fun toMessage(context: AiReplyContext, message: ChatMessage): Message {
        val text = textOf(message)

        return if (message.senderId == context.ai.id) AssistantMessage(text) else UserMessage(text)
    }

    private fun textOf(message: ChatMessage) = when (message.type) {
        ChatMessageType.TEXT -> message.content.orEmpty().take(MESSAGE_MAX_CHARS)
        ChatMessageType.PHOTO -> PHOTO_PLACEHOLDER
        ChatMessageType.VIDEO -> VIDEO_PLACEHOLDER
    }

    companion object {

        const val PHOTO_PLACEHOLDER = "[사진]"
        const val VIDEO_PLACEHOLDER = "[동영상]"
        const val CONTEXT_MAX_CHARS = 1500
        const val MESSAGE_MAX_CHARS = 300
        const val BIO_MAX_CHARS = 200

        private val TIME_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")

        private val LANGUAGE_NAMES = mapOf(
            MemberLocale.KO to "한국어",
            MemberLocale.JA to "일본어",
            MemberLocale.EN to "영어",
            MemberLocale.ZH_TW to "중국어(번체)",
        )

        private val GENDER_NAMES = mapOf(
            Gender.MALE to "남자",
            Gender.FEMALE to "여자",
        )
    }
}
