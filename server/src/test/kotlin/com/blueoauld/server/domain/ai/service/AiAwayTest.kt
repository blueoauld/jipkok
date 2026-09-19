package com.blueoauld.server.domain.ai.service

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AiAwayTest {

    @Test
    fun `자리 비움 표시에서 돌아올 때까지의 분을 읽는다`() {
        // when, then
        assertThat(awayMinutesOf("나 이제 잘게 [자리 비움 480분]")).isEqualTo(480L)
        assertThat(awayMinutesOf("수업 들어가야 돼 [자리 비움 50]")).isEqualTo(50L)
        assertThat(awayMinutesOf("나 이제 잘게")).isNull()
    }

    @Test
    fun `자리 비움 표시를 떼고 본문만 남긴다`() {
        // when, then
        assertThat(removeAwayMarker("나 이제 잘게 [자리 비움 480분]")).isEqualTo("나 이제 잘게")
        assertThat(removeAwayMarker("[자리 비움 30분]")).isEmpty()
        assertThat(removeAwayMarker("잘 자")).isEqualTo("잘 자")
    }
}
