package com.blueoauld.server.domain.push.service

import com.blueoauld.server.TestcontainersConfiguration
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
        val ko = pushMessages.get(MemberLocale.KO, "push.chat.photo")
        val ja = pushMessages.get(MemberLocale.JA, "push.chat.photo")
        val en = pushMessages.get(MemberLocale.EN, "push.chat.photo")

        // then
        assertThat(ko).isEqualTo("사진을 보냈습니다.")
        assertThat(ja).isEqualTo("写真を送りました。")
        assertThat(en).isEqualTo("Sent a photo.")
    }

    @Test
    fun `피드 문구는 다섯 개가 모두 언어마다 채워져 있다`() {
        // given, when
        val codes = (0 until FEED_BODY_COUNT).map { "push.feed.body.$it" }

        // then
        MemberLocale.entries.forEach { locale ->
            val bodies = codes.map { pushMessages.get(locale, it) }
            assertThat(bodies).doesNotContain("")
            assertThat(bodies.toSet()).hasSize(FEED_BODY_COUNT)
        }
    }

    companion object {

        private const val FEED_BODY_COUNT = 5
    }
}
