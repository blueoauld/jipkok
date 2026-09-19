package com.blueoauld.server.domain.ai.service

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AiBubblesTest {

    @Test
    fun `문장 끝과 줄바꿈에서 말풍선을 나눈다`() {
        // when, then
        assertThat(splitBubbles("안녕하세요 ㅎㅎ 반갑네요. 무슨 일로 오셨어요?"))
            .containsExactly("안녕하세요 ㅎㅎ 반갑네요", "무슨 일로 오셨어요?")
        assertThat(splitBubbles("진짜? 처음 들어봐 ㅋㅋ"))
            .containsExactly("진짜?", "처음 들어봐 ㅋㅋ")
        assertThat(splitBubbles("쉬는 날엔 쉬어줘야죠   \n저도 느긋하게 있었어요"))
            .containsExactly("쉬는 날엔 쉬어줘야죠", "저도 느긋하게 있었어요")
    }

    @Test
    fun `문장 끝 마침표 하나는 떼고 말줄임은 둔다`() {
        // when, then
        assertThat(splitBubbles("좋아요.")).containsExactly("좋아요")
        assertThat(splitBubbles("그랬구나... 많이 힘들었겠다.")).containsExactly("그랬구나...", "많이 힘들었겠다")
        assertThat(splitBubbles("음… 그럴 수 있지")).containsExactly("음…", "그럴 수 있지")
        assertThat(splitBubbles("오늘은 여기까지 해..")).containsExactly("오늘은 여기까지 해..")
    }

    @Test
    fun `말풍선은 세 개까지이고 넘치는 문장은 마지막 말풍선에 붙인다`() {
        // when, then
        assertThat(splitBubbles("하나. 둘? 셋! 넷."))
            .containsExactly("하나", "둘?", "셋! 넷")
    }

    @Test
    fun `소수점이나 따옴표 안의 물음표에서는 나누지 않는다`() {
        // when, then
        assertThat(splitBubbles("오늘 3.5km 뛰었어")).containsExactly("오늘 3.5km 뛰었어")
        assertThat(splitBubbles("“뭐하노?”, “밥 묵었나?” 이런 말 많이 해."))
            .containsExactly("“뭐하노?”, “밥 묵었나?” 이런 말 많이 해")
    }

    @Test
    fun `마침표를 떼고 남는 게 없으면 원문을 그대로 쓴다`() {
        // when, then
        assertThat(splitBubbles(".")).containsExactly(".")
    }
}
