package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant

class AiImagesTest {

    @Test
    fun `AI가 마지막으로 말한 뒤 상대가 보낸 사진과 동영상 중 가장 최근 것을 고른다`() {
        // given
        val older = message(2L, USER_ID, ChatMessageType.PHOTO, objectKey = "chats/9/old.webp")
        val latest = message(4L, USER_ID, ChatMessageType.VIDEO, thumbnailObjectKey = "chats/9/thumb.webp")
        val messages = listOf(
            message(1L, AI_ID, ChatMessageType.TEXT),
            older,
            latest,
            message(5L, USER_ID, ChatMessageType.TEXT),
        )

        // when
        val picked = imageMessageOf(context(messages))

        // then
        assertThat(picked).isSameAs(latest)
    }

    @Test
    fun `AI가 그 뒤에 답했거나 글만 있으면 고르지 않는다`() {
        // given
        val answered = listOf(
            message(1L, USER_ID, ChatMessageType.PHOTO, objectKey = "chats/9/a.webp"),
            message(2L, AI_ID, ChatMessageType.TEXT),
        )
        val textOnly = listOf(message(1L, USER_ID, ChatMessageType.TEXT))

        // when, then
        assertThat(imageMessageOf(context(answered))).isNull()
        assertThat(imageMessageOf(context(textOnly))).isNull()
    }

    @Test
    fun `사진은 원본, 동영상은 썸네일을 넘길 이미지로 쓴다`() {
        // given
        val photo = message(1L, USER_ID, ChatMessageType.PHOTO, objectKey = "chats/9/a.webp")
        val video = message(
            2L,
            USER_ID,
            ChatMessageType.VIDEO,
            objectKey = "chats/9/v.mp4",
            thumbnailObjectKey = "chats/9/v.webp",
        )

        // when, then
        assertThat(imageObjectKeyOf(photo)).isEqualTo("chats/9/a.webp")
        assertThat(imageObjectKeyOf(video)).isEqualTo("chats/9/v.webp")
        assertThat(imageObjectKeyOf(message(3L, USER_ID, ChatMessageType.TEXT))).isNull()
    }

    private fun context(messages: List<ChatMessage>) = AiReplyContext(
        ai = mockk<Member> { every { id } returns AI_ID },
        systemPrompt = "프롬프트",
        partner = mockk<Member>(),
        messages = messages,
        language = MemberLocale.KO,
        now = NOW,
    )

    private fun message(
        messageId: Long,
        senderId: Long,
        type: ChatMessageType,
        objectKey: String? = null,
        thumbnailObjectKey: String? = null,
    ) = mockk<ChatMessage> {
        every { id } returns messageId
        every { this@mockk.senderId } returns senderId
        every { this@mockk.type } returns type
        every { this@mockk.objectKey } returns objectKey
        every { this@mockk.thumbnailObjectKey } returns thumbnailObjectKey
    }

    companion object {

        private const val AI_ID = 5L
        private const val USER_ID = 9L
        private val NOW: Instant = Instant.parse("2026-09-19T03:00:00Z")
    }
}
