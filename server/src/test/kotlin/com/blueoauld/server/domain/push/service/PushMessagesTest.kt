package com.blueoauld.server.domain.push.service

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.feed.service.FeedReminder
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class PushMessagesTest {

    @Autowired
    private lateinit var pushMessages: PushMessages

    @Test
    fun `언어마다 다른 문구를 준다`() {
        // given, when
        val ko = pushMessages.get(MemberLocale.KO, CHAT_PHOTO_CODE)
        val ja = pushMessages.get(MemberLocale.JA, CHAT_PHOTO_CODE)
        val en = pushMessages.get(MemberLocale.EN, CHAT_PHOTO_CODE)

        // then
        assertThat(ko).isEqualTo("사진을 보냈습니다.")
        assertThat(ja).isEqualTo("写真を送りました。")
        assertThat(en).isEqualTo("Sent a photo.")
    }

    @Test
    fun `채팅 문구는 모든 언어에 채워져 있다`() {
        // given, when
        val codes = listOf(CHAT_PHOTO_CODE, CHAT_VIDEO_CODE)

        // then
        MemberLocale.entries.forEach { locale ->
            assertThat(codes.map { pushMessages.get(locale, it) }).doesNotContain("")
        }
    }

    @Test
    fun `피드 문구는 모두 언어마다 다르게 채워져 있다`() {
        // given, when
        val codes = (0 until FeedReminder.BODY_COUNT).map { "push.feed.body.$it" }

        // then
        MemberLocale.entries.forEach { locale ->
            val bodies = codes.map { pushMessages.get(locale, it) }
            assertThat(bodies).doesNotContain("")
            assertThat(bodies.toSet()).hasSize(FeedReminder.BODY_COUNT)
        }
    }

    companion object {

        private const val CHAT_PHOTO_CODE = "push.chat.photo"
        private const val CHAT_VIDEO_CODE = "push.chat.video"
    }
}
