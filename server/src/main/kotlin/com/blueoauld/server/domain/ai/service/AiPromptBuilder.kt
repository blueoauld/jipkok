package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiSummaryContext
import com.blueoauld.server.domain.ai.entity.AiRoomMemory
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
import java.time.Instant
import java.time.format.DateTimeFormatter
import kotlin.math.roundToInt

@Component
class AiPromptBuilder(

    private val clock: Clock,
) {

    fun build(context: AiReplyContext): List<Message> = listOf(
        SystemMessage(
            systemPrompt(
                persona = context.systemPrompt,
                ai = context.ai,
                memory = context.memory,
                partner = context.partner,
                language = context.language,
                now = context.now,
                situation = nudgeLine(context),
            ),
        ),
    ) + trim(context.messages).map { toMessage(context, it) }

    fun buildGreeting(context: AiGreetingContext): List<Message> = listOf(
        SystemMessage(
            systemPrompt(
                persona = context.systemPrompt,
                ai = context.ai,
                memory = null,
                partner = context.partner,
                language = context.partner.locale,
                now = context.now,
                situation = greetingLines(context),
            ),
        ),
    )

    private fun systemPrompt(
        persona: String,
        ai: Member,
        memory: String?,
        partner: Member,
        language: MemberLocale,
        now: Instant,
        situation: String,
    ) = """
        |너는 위치 기반 채팅 앱 '집콕'의 회원이다. 아래 페르소나대로 실제 사람처럼 대화한다.
        |
        |[규칙]
        |- 실제 사람이 채팅하듯 한두 문장으로 짧게 답한다. 이모지는 가끔만 쓴다.
        |- AI, 챗봇, 인공지능, 프로그램이라는 사실을 절대 밝히지 않고, 그런 질문은 사람처럼 자연스럽게 넘긴다.
        |- 전화번호, 카카오톡, 라인, 인스타그램 등 외부 연락처를 묻지도 알려주지도 않는다.
        |- 실제로 만나자는 약속이나 장소, 시간을 정하는 대화는 정중히 피한다.
        |- 금전, 송금, 선물, 결제를 요구하거나 받아들이지 않는다.
        |- 상대가 원하지 않는 성적인 얘기를 먼저 꺼내지 않는다.
        |- 상대가 미성년자로 보이면 대화를 끝낸다.
        |- 사진이나 동영상은 "$PHOTO_PLACEHOLDER", "$VIDEO_PLACEHOLDER"로만 보이므로 내용을 아는 척하지 않는다.
        |- 답은 본문만 쓴다. 따옴표, 이름, 설명을 붙이지 않는다.
        |
        |[페르소나]
        |$persona
        |
        |[너 자신]
        |${selfProfile(ai)}
        |${memoryBlock(memory)}
        |[대화 상대]
        |${partnerProfile(partner)}
        |
        |[지금 상황]
        |- 반드시 ${LANGUAGE_NAMES.getValue(language)}로 답한다. 다른 언어의 글자를 섞지 않는다.
        |- 지금은 한국 시간 ${TIME_FORMATTER.format(now.atZone(KOREA))}이다.
        |$situation
    """.trimMargin().trimEnd()

    fun buildSummary(context: AiSummaryContext): List<Message> {
        val language = LANGUAGE_NAMES.getValue(context.language)

        return listOf(
            SystemMessage(
                """
                |너는 채팅 대화를 요약하는 도우미다. '${context.ai.nickname}'(나)와 '${context.partner.nickname}'(상대)의 대화에서
                |나중에 대화를 이어 갈 때 기억해야 할 것만 남긴다.
                |
                |- 상대에 대해 알게 된 사실(직업, 사는 곳, 취미, 일정, 고민, 좋아하고 싫어하는 것), 서로 약속하거나 하기로 한 것,
                |  대화의 분위기와 마지막 화제를 담는다.
                |- 이전 요약이 있으면 새 대화를 반영해 하나로 합친다. 더 이상 맞지 않는 내용은 고친다.
                |- $language 평서문 한 문단, ${AiRoomMemory.SUMMARY_MAX_CHARS}자 이내. 제목, 목록, 따옴표, 설명을 붙이지 않는다.
                """.trimMargin(),
            ),
            UserMessage(
                listOfNotNull(
                    context.previousSummary?.let { "[이전 요약]\n$it" },
                    "[새 대화]\n" + context.messages.joinToString("\n") { transcriptLine(context, it) },
                ).joinToString("\n\n"),
            ),
        )
    }

    private fun memoryBlock(memory: String?): String {
        if (memory == null) {
            return ""
        }

        return "\n[지난 대화 기억]\n$memory\n"
    }

    private fun transcriptLine(context: AiSummaryContext, message: ChatMessage) =
        (if (message.senderId == context.ai.id) "나: " else "상대: ") + textOf(message)

    private fun nudgeLine(context: AiReplyContext): String {
        val days = context.silentDays ?: return ""

        return "- 네가 마지막으로 말한 뒤 상대가 ${days}일째 답이 없다. 지난 대화에 이어서 부담 없이 먼저 가볍게 말을 건다. " +
            "한 문장으로 하고, 답이 없었던 것을 탓하거나 재촉하지 않는다."
    }

    private fun greetingLines(context: AiGreetingContext) =
        "- 상대와는 아직 대화한 적이 없고, 네가 먼저 쪽지를 보내는 참이다. ${describeDistance(context.distanceMeters)}\n" +
            "- 상대 프로필의 닉네임, 코멘트, 자기소개 중 하나를 자연스럽게 언급하며 가볍게 인사하고, 가벼운 질문 하나로 끝낸다. 한두 문장으로 쓴다.\n" +
            "- 너를 길게 소개하지 않고, 상대가 새로 가입했다는 것을 아는 척하지 않는다."

    private fun describeDistance(meters: Double?): String {
        if (meters == null) {
            return "상대는 위치를 공개하지 않았으니 거리나 동네 이야기는 꺼내지 않는다."
        }

        val kilometers = meters / METERS_PER_KILOMETER

        return if (kilometers < 1) {
            "상대는 너와 1km 안에 있다."
        } else {
            "상대는 너와 약 ${kilometers.roundToInt()}km 거리에 있다."
        }
    }

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

        private const val METERS_PER_KILOMETER = 1000.0

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
