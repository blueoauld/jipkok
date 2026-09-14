package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyContext
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
        assertThat(system.text).contains("상대의 닉네임은 '바다'이고 31세 남자다.")
        assertThat(system.text).contains("상대를 부를 때는 '바다'만 쓰고, 너 자신을 그 닉네임으로 부르지 않는다.")
        assertThat(system.text).contains("상대의 코멘트: 산책 좋아해요")
        assertThat(system.text).contains("반드시 일본어로 답한다.")
        assertThat(system.text).contains("2026-09-15 12:30")
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

    private fun context() = AiReplyContext(
        ai = member(AI_ID, "루나", Gender.FEMALE, 1998, comment = null),
        systemPrompt = "밝고 장난기 많은 성격",
        partner = member(USER_ID, "바다", Gender.MALE, 1995, comment = "산책 좋아해요", locale = MemberLocale.JA),
        messages = listOf(
            ChatMessage(roomId = 1L, senderId = USER_ID, type = ChatMessageType.TEXT, content = "안녕하세요"),
            ChatMessage(roomId = 1L, senderId = AI_ID, type = ChatMessageType.TEXT, content = "반가워요"),
            ChatMessage(roomId = 1L, senderId = USER_ID, type = ChatMessageType.PHOTO, objectKey = "chats/9/a.webp"),
        ),
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
        private val NOW: Instant = Instant.parse("2026-09-15T12:30:00+09:00")
    }
}
