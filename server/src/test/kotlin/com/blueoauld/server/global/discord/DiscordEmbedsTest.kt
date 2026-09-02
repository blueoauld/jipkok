package com.blueoauld.server.global.discord

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class DiscordEmbedsTest {

    @Test
    fun `짧은 본문은 제목과 함께 하나로 만든다`() {
        // given, when
        val embeds = DiscordEmbeds.of(TITLE, "첫 줄\n둘째 줄")

        // then
        assertThat(embeds).hasSize(1)
        assertThat(embeds.single().title).isEqualTo(TITLE)
        assertThat(embeds.single().description).isEqualTo("첫 줄\n둘째 줄")
    }

    @Test
    fun `상한과 길이가 같은 본문은 쪼개지 않는다`() {
        // given
        val body = "가".repeat(DiscordEmbeds.DESCRIPTION_MAX_LENGTH)

        // when
        val embeds = DiscordEmbeds.of(TITLE, body)

        // then
        assertThat(embeds).hasSize(1)
        assertThat(embeds.single().description).hasSize(DiscordEmbeds.DESCRIPTION_MAX_LENGTH)
    }

    @Test
    fun `상한을 넘는 한 줄은 잘라서 여러 개로 만든다`() {
        // given
        val body = "가".repeat(DiscordEmbeds.DESCRIPTION_MAX_LENGTH + 1)

        // when
        val embeds = DiscordEmbeds.of(TITLE, body)

        // then
        assertThat(embeds).hasSize(2)
        assertThat(embeds.first().description).hasSize(DiscordEmbeds.DESCRIPTION_MAX_LENGTH)
        assertThat(embeds.last().description).hasSize(1)
    }

    @Test
    fun `제목은 첫 번째에만 붙인다`() {
        // given
        val body = "가".repeat(DiscordEmbeds.DESCRIPTION_MAX_LENGTH + 1)

        // when
        val embeds = DiscordEmbeds.of(TITLE, body)

        // then
        assertThat(embeds.first().title).isEqualTo(TITLE)
        assertThat(embeds.drop(1).map { it.title }).containsOnlyNulls()
    }

    @Test
    fun `줄 단위로 묶어 상한을 넘기지 않는다`() {
        // given
        val line = "가".repeat(3000)

        // when
        val embeds = DiscordEmbeds.of(TITLE, "$line\n$line")

        // then
        assertThat(embeds).hasSize(2)
        assertThat(embeds.map { it.description }).allSatisfy {
            assertThat(it).hasSize(3000)
        }
    }

    @Test
    fun `이어 붙여 상한에 딱 맞으면 한 덩이로 둔다`() {
        // given
        val first = "가".repeat(2047)
        val second = "나".repeat(2048)

        // when
        val embeds = DiscordEmbeds.of(TITLE, "$first\n$second")

        // then
        assertThat(embeds).hasSize(1)
        assertThat(embeds.single().description).hasSize(DiscordEmbeds.DESCRIPTION_MAX_LENGTH)
    }

    @Test
    fun `이어 붙여 한 글자라도 넘치면 나눈다`() {
        // given
        val line = "가".repeat(2048)

        // when
        val embeds = DiscordEmbeds.of(TITLE, "$line\n$line")

        // then
        assertThat(embeds).hasSize(2)
    }

    @Test
    fun `빈 줄도 그대로 남긴다`() {
        // given, when
        val embeds = DiscordEmbeds.of(TITLE, "첫 줄\n\n셋째 줄")

        // then
        assertThat(embeds.single().description).isEqualTo("첫 줄\n\n셋째 줄")
    }

    companion object {

        private const val TITLE = "제목"
    }
}
