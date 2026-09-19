package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiPhotoCounts
import com.blueoauld.server.domain.ai.dto.AiPromptImage
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiSummaryContext
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.member.entity.type.MemberRole
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.ai.chat.messages.AssistantMessage
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset

class AiPromptBuilderTest {

    private val builder = AiPromptBuilder(Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `시스템 메시지에 페르소나, 양쪽 프로필, 상대 언어, 한국 시간이 들어간다`() {
        // when
        val messages = builder.build(context())

        // then
        val system = messages.first() as SystemMessage
        assertThat(system.text).contains("밝고 장난기 많은 성격")
        assertThat(system.text).contains("너의 닉네임은 '루나'이고 28세 여자다.")
        assertThat(system.text).contains("상대의 닉네임은 '바다'이고 31세 남자다. 너 자신을 그 닉네임으로 부르지 않는다.")
        assertThat(system.text).contains("상대의 코멘트: 산책 좋아해요")
        assertThat(system.text).contains("반드시 일본어로 답한다.")
        assertThat(system.text).contains("지금은 한국 시간 2026-09-15 (화) 12:30이다.")
    }

    @Test
    fun `상대의 마지막 말이 한 시간 넘게 지났으면 언제 왔고 지금 봤다는 것을 넣는다`() {
        // when
        val late = systemText(context().copy(lastPartnerMessageAt = NOW.minus(Duration.ofMinutes(379))))
        val recent = systemText(context().copy(lastPartnerMessageAt = NOW.minus(Duration.ofMinutes(59))))
        val nudge = systemText(context().copy(silentDays = 4, lastPartnerMessageAt = NOW.minus(Duration.ofDays(5))))

        // then
        assertThat(late).contains("상대의 마지막 말은 6시간 전인 09-15 06:11에 왔고, 너는 지금 그걸 봤다.")
        assertThat(late.indexOf("상대의 마지막 말은")).isLessThan(late.indexOf(AiPromptBuilder.NO_REPLY))
        assertThat(recent).doesNotContain("상대의 마지막 말은")
        assertThat(nudge).doesNotContain("상대의 마지막 말은")
    }

    @Test
    fun `대화 사이가 한 시간 넘게 비면 그 자리에 흐른 시간을 시스템 메시지로 넣는다`() {
        // given
        val start = NOW.minus(Duration.ofDays(2))
        val messages = listOf(
            message(USER_ID, "잘자요", start),
            message(AI_ID, "잘 자요", start.plus(Duration.ofMinutes(30))),
            message(USER_ID, "일어났어?", start.plus(Duration.ofHours(8))),
            message(USER_ID, "뭐해", start.plus(Duration.ofDays(1)).plus(Duration.ofHours(8))),
        )

        // when
        val built = builder.build(context().copy(messages = messages)).drop(1)

        // then
        assertThat(built.map { it.text }).containsExactly("잘자요", "잘 자요", "(7시간 뒤)", "일어났어?", "(1일 뒤)", "뭐해")
        assertThat(built[2]).isInstanceOf(SystemMessage::class.java)
        assertThat(built[4]).isInstanceOf(SystemMessage::class.java)
    }

    @Test
    fun `답장 프롬프트에만 자리를 비울 때 표시를 붙이라는 지시가 들어간다`() {
        // when
        val plain = systemText(context())
        val nudge = systemText(context().copy(silentDays = 3))

        // then
        assertThat(plain).contains("대화를 마칠 때는 답 끝에 [자리 비움 N분]을 붙인다.")
        assertThat(nudge).doesNotContain("[자리 비움")
    }

    @Test
    fun `AI가 최근에 이미 쓴 돌봄 문구는 다시 쓰지 말라고 짚고 상대가 쓴 말은 세지 않는다`() {
        // given
        val messages = listOf(
            message(AI_ID, "오늘은 푹 쉬세요", NOW),
            message(USER_ID, "네", NOW),
            message(AI_ID, "밥은 꼭 챙겨 먹어요", NOW),
            message(USER_ID, "무리하지 마세요", NOW),
        )

        // when
        val repeated = systemText(context().copy(messages = messages))
        val fresh = systemText(context())

        // then
        assertThat(repeated).contains("- 최근에 이미 '푹 쉬', '챙겨 먹' 같은 말을 했으니 다시 쓰지 않는다.")
        assertThat(fresh).doesNotContain("최근에 이미")
    }

    @Test
    fun `넘겨받은 사진은 그 메시지에만 이미지로 붙인다`() {
        // given
        val photo = mockk<ChatMessage> {
            every { id } returns PHOTO_MESSAGE_ID
            every { senderId } returns USER_ID
            every { type } returns ChatMessageType.PHOTO
            every { createdAt } returns NOW
        }
        val messages = listOf(message(USER_ID, "이거 봐", NOW), photo)
        val image = AiPromptImage(PHOTO_MESSAGE_ID, IMAGE_URL)

        // when
        val built = builder.build(context().copy(messages = messages), image).drop(1)

        // then
        val withImage = built.last() as UserMessage
        assertThat(withImage.text).isEqualTo(AiPromptBuilder.PHOTO_PLACEHOLDER)
        assertThat(withImage.media.map { it.data }).containsExactly(IMAGE_URL)
        assertThat((built.first() as UserMessage).media).isEmpty()
    }

    @Test
    fun `답할 언어는 계정 언어가 아니라 넘겨받은 언어를 따른다`() {
        // given
        val context = context().copy(language = MemberLocale.KO)

        // when
        val text = (builder.build(context).first() as SystemMessage).text!!

        // then
        assertThat(context.partner.locale).isEqualTo(MemberLocale.JA)
        assertThat(text).contains("반드시 한국어로 답한다.")
        assertThat(text).doesNotContain("일본어")
    }

    @Test
    fun `AI마다 같은 규칙, 페르소나, 자기 프로필이 앞에 오고 상대와 시각은 뒤에 온다`() {
        // when
        val text = (builder.build(context()).first() as SystemMessage).text!!

        // then
        assertThat(text.indexOf("[규칙]")).isLessThan(text.indexOf("[페르소나]"))
        assertThat(text.indexOf("[페르소나]")).isLessThan(text.indexOf("[너 자신]"))
        assertThat(text.indexOf("[너 자신]")).isLessThan(text.indexOf("[대화 상대]"))
        assertThat(text.indexOf("[대화 상대]")).isLessThan(text.indexOf("[지금 상황]"))
        assertThat(text.indexOf("반드시 일본어로")).isGreaterThan(text.indexOf("[지금 상황]"))
    }

    @Test
    fun `며칠째 조용한 방이면 먼저 말을 걸라는 지시가 붙고 아니면 붙지 않는다`() {
        // when
        val plain = (builder.build(context()).first() as SystemMessage).text!!
        val nudge = (builder.build(context().copy(silentDays = 3)).first() as SystemMessage).text!!

        // then
        assertThat(plain).doesNotContain("먼저 가볍게 말을 건다")
        assertThat(nudge).contains("상대가 3일째 답이 없다")
        assertThat(nudge).contains("먼저 가볍게 말을 건다")
    }

    @Test
    fun `답장 프롬프트에만 맞장구에는 답하지 않고 표시만 쓰라는 지시가 붙는다`() {
        // when
        val plain = systemText(context())
        val nudge = systemText(context().copy(silentDays = 3))
        val greeting = (builder.buildGreeting(greetingContext(distanceMeters = null)).single() as SystemMessage).text!!

        // then
        assertThat(plain).endsWith("답하지 않을 때는 ${AiPromptBuilder.NO_REPLY}만 쓴다.")
        assertThat(nudge).doesNotContain(AiPromptBuilder.NO_REPLY)
        assertThat(greeting).doesNotContain(AiPromptBuilder.NO_REPLY)
    }

    @Test
    fun `대화 기억이 있으면 자기 프로필 뒤, 상대 프로필 앞에 넣는다`() {
        // when
        val text = (builder.build(context().copy(memory = "상대는 부산에 산다.")).first() as SystemMessage).text!!

        // then
        assertThat(text.indexOf("[너 자신]")).isLessThan(text.indexOf("[지난 대화 기억]"))
        assertThat(text.indexOf("[지난 대화 기억]")).isLessThan(text.indexOf("[대화 상대]"))
        assertThat(text).contains("상대는 부산에 산다.")
        assertThat((builder.build(context()).first() as SystemMessage).text).doesNotContain("[지난 대화 기억]")
    }

    @Test
    fun `요약 프롬프트는 AI 자신의 메모로 상대와 나를 나눠 쓰게 하고 이전 메모와 화자를 구분한 새 대화를 담는다`() {
        // when
        val messages = builder.buildSummary(
            AiSummaryContext(
                ai = context().ai,
                partner = context().partner,
                previousSummary = "상대는 부산에 산다.",
                messages = context().messages,
                language = context().language,
            ),
        )

        // then
        assertThat(messages).hasSize(2)
        val system = (messages[0] as SystemMessage).text!!
        assertThat(system).contains("너는 '루나'(나)이다. '바다'(상대)와 나눈 채팅을")
        assertThat(system).contains("\"상대:\"로 시작하는 문단")
        assertThat(system).contains("\"나:\"로 시작하는 문단")
        assertThat(system).contains("일본어 평서문으로 모두 합쳐 500자 이내")
        val user = (messages[1] as UserMessage).text!!
        assertThat(user).contains("[이전 메모]\n상대는 부산에 산다.")
        assertThat(user).contains("상대: 안녕하세요")
        assertThat(user).contains("나: 반가워요")
        assertThat(user).contains("상대: " + AiPromptBuilder.PHOTO_PLACEHOLDER)
    }

    @Test
    fun `자기 프로필에 사진 장수와 비밀사진이 누구에게 보이는지 넣는다`() {
        // given
        val secretOnly = AiPhotoCounts(publicCount = 0, secretCount = 1)
        val greetingWithSecret = greetingContext(distanceMeters = null).copy(aiPhotos = secretOnly)

        // when
        val withSecret = systemText(context().copy(aiPhotos = AiPhotoCounts(publicCount = 3, secretCount = 2)))
        val withoutSecret = systemText(context().copy(aiPhotos = AiPhotoCounts(publicCount = 1, secretCount = 0)))
        val greeting = (builder.buildGreeting(greetingWithSecret).single() as SystemMessage).text!!

        // then
        assertThat(withSecret).contains("너의 사진: 프로필 사진 3장, 비밀사진 2장. 비밀사진은 네가 따로 공개해 준 사람만 볼 수 있고")
        assertThat(withSecret).contains("너는 아직 아무에게도 공개하지 않았다.")
        assertThat(withSecret.indexOf("너의 사진:")).isLessThan(withSecret.indexOf("[대화 상대]"))
        assertThat(withoutSecret).contains("너의 사진: 프로필 사진 1장, 비밀사진 없음")
        assertThat(withoutSecret).doesNotContain("잠긴 채")
        assertThat(greeting).contains("너의 사진: 프로필 사진 없음, 비밀사진 1장.")
    }

    @Test
    fun `비어 있는 코멘트와 자기소개는 없음으로 적는다`() {
        // given
        val partner = member(USER_ID, "바다", Gender.MALE, 1995, comment = null, bio = null)

        // when
        val text = systemText(context().copy(partner = partner))

        // then
        assertThat(text).contains("너의 코멘트: 없음\n너의 자기소개: 없음")
        assertThat(text).contains("상대의 코멘트: 없음\n상대의 자기소개: 없음")
    }

    @Test
    fun `AI가 아직 말한 적 없는 방이면 상대가 먼저 말을 걸었다고 알리고 아니면 알리지 않는다`() {
        // given
        val partnerOnly = context().messages.filter { it.senderId == USER_ID }

        // when
        val first = systemText(context().copy(messages = partnerOnly))
        val remembered = systemText(context().copy(messages = partnerOnly, memory = "상대는 부산에 산다."))
        val continued = systemText(context())

        // then
        assertThat(first).contains("상대가 먼저 말을 걸었고 너는 지금 처음 답한다.")
        assertThat(remembered).doesNotContain("상대가 먼저 말을 걸었고")
        assertThat(continued).doesNotContain("상대가 먼저 말을 걸었고")
    }

    @Test
    fun `자기소개는 200자까지만 넣는다`() {
        // given
        val partner = member(USER_ID, "바다", Gender.MALE, 1995, comment = null, bio = "가".repeat(500))

        // when
        val text = (builder.build(context().copy(partner = partner)).first() as SystemMessage).text!!

        // then
        assertThat(text).contains("상대의 자기소개: " + "가".repeat(AiPromptBuilder.BIO_MAX_CHARS))
        assertThat(text).doesNotContain("가".repeat(AiPromptBuilder.BIO_MAX_CHARS + 1))
    }

    @Test
    fun `긴 메시지는 300자로 자르고 합쳐서 1500자를 넘기면 오래된 것부터 뺀다`() {
        // given
        val long = "나".repeat(1000)
        val messages = List(6) { index ->
            ChatMessage(
                roomId = 1L,
                senderId = if (index % 2 ==
                0
                ) {
                    USER_ID
                } else {
                    AI_ID
                },
                    type = ChatMessageType.TEXT,
                content = long,
            )
        }

        // when
        val built = builder.build(context().copy(messages = messages)).drop(1)

        // then
        assertThat(built).hasSize(5)
        assertThat(built.map { it.text!!.length }).containsOnly(AiPromptBuilder.MESSAGE_MAX_CHARS)
        assertThat(built.last()).isInstanceOf(AssistantMessage::class.java)
    }

    @Test
    fun `모든 메시지가 한도를 넘어도 마지막 메시지는 남긴다`() {
        // given
        val messages = listOf(
            ChatMessage(roomId = 1L, senderId = USER_ID, type = ChatMessageType.TEXT, content = "가".repeat(2000)),
        )

        // when
        val built = builder.build(context().copy(messages = messages)).drop(1)

        // then
        assertThat(built).hasSize(1)
        assertThat(built.single().text).hasSize(AiPromptBuilder.MESSAGE_MAX_CHARS)
    }

    @Test
    fun `대화는 시간순으로 AI 메시지는 assistant, 상대 메시지는 user가 되고 미디어는 자리표시자로 바뀐다`() {
        // when
        val messages = builder.build(context()).drop(1)

        // then
        assertThat(messages).hasSize(3)
        assertThat(messages[0]).isInstanceOf(UserMessage::class.java)
        assertThat(messages[0].text).isEqualTo("안녕하세요")
        assertThat(messages[1]).isInstanceOf(AssistantMessage::class.java)
        assertThat(messages[1].text).isEqualTo("반가워요")
        assertThat(messages[2]).isInstanceOf(UserMessage::class.java)
        assertThat(messages[2].text).isEqualTo(AiPromptBuilder.PHOTO_PLACEHOLDER)
    }

    @Test
    fun `첫 쪽지 프롬프트는 시스템 메시지 하나이고 거리와 첫 인사 지시가 들어간다`() {
        // when
        val messages = builder.buildGreeting(greetingContext(distanceMeters = 2_400.0))

        // then
        assertThat(messages).hasSize(1)
        val text = (messages.single() as SystemMessage).text!!
        assertThat(text).contains("[페르소나]\n밝고 장난기 많은 성격")
        assertThat(text).contains("상대의 닉네임은 '바다'이고 31세 남자다.")
        assertThat(text).contains("상대는 너와 약 2km 거리에 있다.")
        assertThat(text).contains("네가 먼저 쪽지를 보내는 참이다")
        assertThat(text).contains("짧게 인사만 해도 되고, 상대 프로필에서 눈에 띄는 게 있으면 자연스럽게 짚어도 된다.")
        assertThat(text).contains("'코멘트', '자기소개'처럼 앱의 칸 이름은 말하지 않고, 질문은 많아야 하나다.")
        assertThat(text).contains("새로 가입했다는 것을 아는 척하지 않는다")
        assertThat(text).doesNotContain("[지난 대화 기억]")
        assertThat(text).doesNotContain("답이 없다")
    }

    @Test
    fun `첫 쪽지 프롬프트는 상대 코멘트와 자기소개가 없으면 프로필을 언급하라고 하지 않는다`() {
        // given
        val partner = member(USER_ID, "바다", Gender.MALE, 1995, comment = null, locale = MemberLocale.JA)
        val context = greetingContext(distanceMeters = null).copy(partner = partner)

        // when
        val text = (builder.buildGreeting(context).single() as SystemMessage).text!!

        // then
        assertThat(text).contains("상대 프로필에 코멘트와 자기소개가 없으니 짧게 인사만 하거나 가벼운 질문 하나를 붙인다.")
        assertThat(text).doesNotContain("눈에 띄는 게 있으면")
    }

    @Test
    fun `첫 쪽지 프롬프트는 1km 안이면 거리 대신 가깝다고 쓴다`() {
        // when
        val text = (builder.buildGreeting(greetingContext(distanceMeters = 300.0)).single() as SystemMessage).text!!

        // then
        assertThat(text).contains("상대는 너와 1km 안에 있다.")
    }

    @Test
    fun `첫 쪽지 프롬프트는 위치가 없으면 거리 이야기를 꺼내지 말라고 쓴다`() {
        // when
        val text = (builder.buildGreeting(greetingContext(distanceMeters = null)).single() as SystemMessage).text!!

        // then
        assertThat(text).contains("상대는 위치를 공개하지 않았으니 거리나 동네 이야기는 꺼내지 않는다.")
        assertThat(text).doesNotContain("km")
    }

    private fun systemText(context: AiReplyContext) = (builder.build(context).first() as SystemMessage).text!!

    private fun message(senderId: Long, content: String, createdAt: Instant) = mockk<ChatMessage> {
        every { id } returns 0L
        every { this@mockk.senderId } returns senderId
        every { type } returns ChatMessageType.TEXT
        every { this@mockk.content } returns content
        every { this@mockk.createdAt } returns createdAt
    }

    private fun greetingContext(distanceMeters: Double?) = AiGreetingContext(
        ai = member(AI_ID, "루나", Gender.FEMALE, 1998, comment = null),
        systemPrompt = "밝고 장난기 많은 성격",
        partner = member(USER_ID, "바다", Gender.MALE, 1995, comment = "산책 좋아해요", locale = MemberLocale.JA),
        now = NOW,
        distanceMeters = distanceMeters,
    )

    private fun context() = AiReplyContext(
        ai = member(AI_ID, "루나", Gender.FEMALE, 1998, comment = null),
        systemPrompt = "밝고 장난기 많은 성격",
        partner = member(USER_ID, "바다", Gender.MALE, 1995, comment = "산책 좋아해요", locale = MemberLocale.JA),
        messages = listOf(
            ChatMessage(roomId = 1L, senderId = USER_ID, type = ChatMessageType.TEXT, content = "안녕하세요"),
            ChatMessage(roomId = 1L, senderId = AI_ID, type = ChatMessageType.TEXT, content = "반가워요"),
            ChatMessage(roomId = 1L, senderId = USER_ID, type = ChatMessageType.PHOTO, objectKey = "chats/9/a.webp"),
        ),
        language = MemberLocale.JA,
        now = NOW,
    )

    private fun member(
        memberId: Long,
        nickname: String,
        gender: Gender,
        birthYear: Int,
        comment: String?,
        locale: MemberLocale = MemberLocale.KO,
        bio: String? = null,
    ) = mockk<Member> {
        every { id } returns memberId
        every { this@mockk.nickname } returns nickname
        every { this@mockk.gender } returns gender
        every { this@mockk.birthYear } returns birthYear
        every { this@mockk.comment } returns comment
        every { this@mockk.bio } returns bio
        every { this@mockk.locale } returns locale
        every { role } returns MemberRole.MEMBER
    }

    companion object {

        private const val AI_ID = 5L
        private const val USER_ID = 9L
        private const val PHOTO_MESSAGE_ID = 7L
        private const val IMAGE_URL = "https://photos.example.com/chats/9/a.webp"
        private val NOW: Instant = Instant.parse("2026-09-15T12:30:00+09:00")
    }
}
