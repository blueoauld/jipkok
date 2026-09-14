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
        assertThat(system.text).contains("닉네임 루나, 28세, 여자")
        assertThat(system.text).contains("닉네임 바다, 31세, 남자")
        assertThat(system.text).contains("코멘트: 산책 좋아해요")
        assertThat(system.text).contains("반드시 일본어로 답한다.")
        assertThat(system.text).contains("2026-09-15 12:30")
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
    ) = mockk<Member> {
        every { id } returns memberId
        every { this@mockk.nickname } returns nickname
        every { this@mockk.gender } returns gender
        every { this@mockk.birthYear } returns birthYear
        every { this@mockk.comment } returns comment
        every { bio } returns null
        every { this@mockk.locale } returns locale
        every { role } returns MemberRole.MEMBER
    }

    companion object {

        private const val AI_ID = 5L
        private const val USER_ID = 9L
        private val NOW: Instant = Instant.parse("2026-09-15T12:30:00+09:00")
    }
}
