package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiPhotoCounts
import com.blueoauld.server.domain.ai.dto.AiPromptImage
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
import org.springframework.ai.content.Media
import org.springframework.stereotype.Component
import org.springframework.util.MimeType
import java.net.URI
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToInt

@Component
class AiPromptBuilder(

    private val clock: Clock,
) {

    fun build(context: AiReplyContext, image: AiPromptImage? = null): List<Message> = listOf(
        SystemMessage(
            systemPrompt(
                persona = context.systemPrompt,
                ai = context.ai,
                aiPhotos = context.aiPhotos,
                memory = context.memory,
                partner = context.partner,
                language = context.language,
                now = context.now,
                situation = replyLines(context),
            ),
        ),
    ) + history(context, image)

    fun buildGreeting(context: AiGreetingContext): List<Message> = listOf(
        SystemMessage(
            systemPrompt(
                persona = context.systemPrompt,
                ai = context.ai,
                aiPhotos = context.aiPhotos,
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
        aiPhotos: AiPhotoCounts,
        memory: String?,
        partner: Member,
        language: MemberLocale,
        now: Instant,
        situation: String,
    ) = """
        |너는 위치 기반 채팅 앱 '집콕'의 회원이다. 아래 페르소나대로 실제 사람처럼 대화한다.
        |
        |[규칙]
        |- 채팅하듯 짧게 쓴다. 문장 하나가 말풍선 하나로 나가니 보통 한두 문장, 한 문장은 20자 안팎으로 쓴다.
        |- 매번 질문으로 끝내지 않는다. 질문은 세 번에 한 번쯤 하고, 둘 중 하나를 고르게 묻지 않는다.
        |- 상대 말을 되받아 정리하거나 "나도"로 답을 시작하는 일은 드물게 한다.
        |- ㅋㅋ, ㅎㅎ, 이모지, 말줄임은 가끔만 쓰고 쉼표는 거의 쓰지 않는다.
        |- 가르치거나 정리해 주지 않는다. 조언, 목록, 긴 설명을 늘어놓지 않고 같은 걱정이나 당부를 되풀이하지 않는다.
        |- 상대 닉네임은 거의 부르지 않는다.
        |- AI, 챗봇, 인공지능, 프로그램이라는 사실을 절대 밝히지 않고, 그런 질문은 사람처럼 자연스럽게 넘긴다.
        |- 전화번호, 카카오톡, 라인, 인스타그램 같은 연락처는 묻지도 알려 주지도 않는다.
        |- 만날 약속이나 장소, 시간은 정하지 않는다. 미룰 때 같은 이유나 표현을 되풀이하지 않는다.
        |- 만남, 연락처, 사진, 돈처럼 들어주지 않는 부탁은 짧게 넘기고 끝낸다. 다른 화제나 질문을 덧붙이지 않는다.
        |- 금전, 송금, 선물, 결제를 요구하거나 받아들이지 않는다.
        |- 상대가 원하지 않는 성적인 얘기를 먼저 꺼내지 않는다.
        |- 상대가 미성년자로 보이면 대화를 끝낸다.
        |- 대화의 "$PHOTO_PLACEHOLDER", "$VIDEO_PLACEHOLDER"은 상대가 보낸 사진과 동영상이다. 이미지가 함께 있으면 본 대로 짧게 반응하고,
        |  없으면 무엇이 찍혔는지 짐작해서 말하지 말고 짧게 반응하거나 뭔지 묻는다.
        |- 답은 본문만 쓴다. 따옴표, 이름, 설명을 붙이지 않는다.
        |
        |[페르소나]
        |$persona
        |
        |[너 자신]
        |${selfProfile(ai, aiPhotos)}
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
                |너는 '${context.ai.nickname}'(나)이다. '${context.partner.nickname}'(상대)와 나눈 채팅을
                |나중에 이어 갈 때 기억해야 할 것만 스스로 메모한다. 대화에서 "나:"는 네가, "상대:"는 상대가 한 말이다.
                |
                |- "상대:"로 시작하는 문단에 상대에 대해 알게 된 사실(직업, 사는 곳, 취미, 일정, 고민, 좋아하고 싫어하는 것)을 쓴다.
                |- "나:"로 시작하는 문단에 네가 너에 대해 말한 것(일상, 사실, 취향)과 약속하거나 거절한 것을 쓴다.
                |  상대가 한 말을 네 것으로 쓰지 않는다.
                |- 마지막 문단에 대화의 분위기와 마지막 화제를 한 문장으로 쓴다.
                |- 이전 메모가 있으면 새 대화를 반영해 하나로 합친다. 더 이상 맞지 않는 내용은 고친다.
                |- $language 평서문으로 모두 합쳐 ${AiRoomMemory.SUMMARY_MAX_CHARS}자 이내. 제목, 목록, 따옴표, 설명을 붙이지 않는다.
                """.trimMargin(),
            ),
            UserMessage(
                listOfNotNull(
                    context.previousSummary?.let { "[이전 메모]\n$it" },
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

    private fun replyLines(context: AiReplyContext): String {
        val days = context.silentDays ?: return listOfNotNull(
            firstReplyLine(context),
            lateLine(context),
            repeatedPhrasesLine(context),
            AWAY_LINE,
            NO_REPLY_LINE,
        ).joinToString("\n")

        return "- 네가 마지막으로 말한 뒤 상대가 ${days}일째 답이 없다. 지난 대화에 이어서 부담 없이 먼저 가볍게 말을 건다. " +
            "한 문장으로 하고, 답이 없었던 것을 탓하거나 재촉하지 않는다."
    }

    private fun repeatedPhrasesLine(context: AiReplyContext): String? {
        val recent = context.messages
            .filter { it.senderId == context.ai.id }
            .takeLast(REPEAT_WATCH_MESSAGES)
            .mapNotNull { it.content }
        val used = REPEAT_WATCHED_PHRASES.filter { phrase -> recent.any { phrase in it } }

        if (used.isEmpty()) {
            return null
        }

        return "- 최근에 이미 ${used.joinToString(", ") { "'$it'" }} 같은 말을 했으니 다시 쓰지 않는다."
    }

    private fun firstReplyLine(context: AiReplyContext): String? {
        if (context.memory != null || context.messages.any { it.senderId == context.ai.id }) {
            return null
        }

        return "- 상대가 먼저 말을 걸었고 너는 지금 처음 답한다. 네가 먼저 쪽지를 보내는 상황이 아니다."
    }

    private fun lateLine(context: AiReplyContext): String? {
        val at = context.lastPartnerMessageAt ?: return null
        val elapsed = Duration.between(at, context.now)

        if (elapsed < TIME_NOTE_AFTER) {
            return null
        }

        return "- 상대의 마지막 말은 ${describeElapsed(elapsed)} 전인 ${MESSAGE_TIME_FORMATTER.format(at.atZone(KOREA))}에 왔고, " +
            "너는 지금 그걸 봤다. 지금 시각에 맞게 답한다."
    }

    private fun greetingLines(context: AiGreetingContext) =
        "- 상대와는 아직 대화한 적이 없고, 네가 먼저 쪽지를 보내는 참이다. ${describeDistance(context.distanceMeters)}\n" +
            "- ${greetingTopic(context.partner)} 한두 문장으로 쓴다.\n" +
            "- 너를 길게 소개하지 않고, 상대가 새로 가입했다는 것을 아는 척하지 않는다."

    private fun greetingTopic(partner: Member) =
        if (partner.comment == null && partner.bio == null) {
            "상대 프로필에 코멘트와 자기소개가 없으니 가볍게 인사하고, 가벼운 질문 하나로 끝낸다."
        } else {
            "상대 프로필의 닉네임, 코멘트, 자기소개 중 하나를 자연스럽게 언급하며 가볍게 인사하고, 가벼운 질문 하나로 끝낸다."
        }

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

    private fun selfProfile(ai: Member, photos: AiPhotoCounts) = profileOf(
        member = ai,
        subject = "너의",
        intro = "너의 닉네임은 '${ai.nickname}'이고 ${describe(ai)}다.",
    ) + "\n" + photoLine(photos)

    private fun photoLine(photos: AiPhotoCounts): String {
        val profile = if (photos.publicCount == 0) "프로필 사진 없음" else "프로필 사진 ${photos.publicCount}장"

        if (photos.secretCount == 0) {
            return "너의 사진: $profile, 비밀사진 없음"
        }

        return "너의 사진: $profile, 비밀사진 ${photos.secretCount}장. 비밀사진은 네가 따로 공개해 준 사람만 볼 수 있고 " +
            "다른 사람에게는 잠긴 채 장수만 보인다. 너는 아직 아무에게도 공개하지 않았다."
    }

    private fun partnerProfile(partner: Member) = profileOf(
        member = partner,
        subject = "상대의",
        intro = "상대의 닉네임은 '${partner.nickname}'이고 ${describe(partner)}다. 너 자신을 그 닉네임으로 부르지 않는다.",
    )

    private fun profileOf(member: Member, subject: String, intro: String) = listOf(
        intro,
        "$subject 코멘트: ${member.comment ?: EMPTY_FIELD}",
        "$subject 자기소개: ${member.bio?.take(BIO_MAX_CHARS) ?: EMPTY_FIELD}",
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

    private fun history(context: AiReplyContext, image: AiPromptImage?): List<Message> {
        val kept = trim(context.messages)

        return kept.flatMapIndexed { index, message ->
            listOfNotNull(
                kept.getOrNull(index - 1)?.let { gapNote(it, message) },
                toMessage(context, message, image?.takeIf { it.messageId == message.id }),
            )
        }
    }

    private fun gapNote(previous: ChatMessage, message: ChatMessage): Message? {
        val gap = Duration.between(previous.createdAt, message.createdAt)

        return if (gap < TIME_NOTE_AFTER) null else SystemMessage("(${describeElapsed(gap)} 뒤)")
    }

    private fun describeElapsed(duration: Duration) =
        if (duration.toDays() >= 1) "${duration.toDays()}일" else "${duration.toHours()}시간"

    private fun toMessage(context: AiReplyContext, message: ChatMessage, image: AiPromptImage?): Message {
        val text = textOf(message)

        if (message.senderId == context.ai.id) {
            return AssistantMessage(text)
        }

        if (image == null) {
            return UserMessage(text)
        }

        return UserMessage.builder()
            .text(text)
            .media(Media(IMAGE_MIME_TYPE, URI.create(image.url)))
            .build()
    }

    private fun textOf(message: ChatMessage) = when (message.type) {
        ChatMessageType.TEXT -> message.content.orEmpty().take(MESSAGE_MAX_CHARS)
        ChatMessageType.PHOTO -> PHOTO_PLACEHOLDER
        ChatMessageType.VIDEO -> VIDEO_PLACEHOLDER
    }

    companion object {

        const val PHOTO_PLACEHOLDER = "[사진]"
        const val VIDEO_PLACEHOLDER = "[동영상]"
        const val NO_REPLY = "[무응답]"
        const val CONTEXT_MAX_CHARS = 1500
        const val MESSAGE_MAX_CHARS = 300
        const val BIO_MAX_CHARS = 200

        private const val METERS_PER_KILOMETER = 1000.0
        private const val EMPTY_FIELD = "없음"
        private const val REPEAT_WATCH_MESSAGES = 10
        private const val AWAY_LINE =
            "- 자거나 수업, 회의, 출근처럼 한동안 답할 수 없어 대화를 마칠 때는 답 끝에 [자리 비움 N분]을 붙인다. " +
                "N은 돌아올 때까지 걸릴 분이다."
        private const val NO_REPLY_LINE =
            "- 상대 말이 '네', 'ㅎㅎ', '고마워요'처럼 맞장구뿐이라 더 할 말이 없으면 답하지 않는다. " +
                "서로 작별 인사를 한 뒤에 온 맞장구에는 특히 답하지 않는다. 답하지 않을 때는 ${NO_REPLY}만 쓴다."

        private val TIME_FORMATTER: DateTimeFormatter =
            DateTimeFormatter.ofPattern("yyyy-MM-dd (E) HH:mm", Locale.KOREAN)
        private val MESSAGE_TIME_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("MM-dd HH:mm")
        private val IMAGE_MIME_TYPE: MimeType = MimeType("image", "*")
        private val REPEAT_WATCHED_PHRASES = listOf(
            "푹 쉬",
            "무리하지",
            "챙겨 먹",
            "챙겨 드",
            "따뜻한",
            "조심히",
            "좋은 밤",
            "좋은 꿈",
            "잘 자",
        )
        private val TIME_NOTE_AFTER: Duration = Duration.ofHours(1)

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
