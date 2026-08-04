package com.blueoauld.server.domain.member.service

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.ai.chat.client.ChatClient
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${spring.ai.openai.api-key:}'.isEmpty()")
class OpenAiTextModerator(

    chatClientBuilder: ChatClient.Builder,
) : TextModerator {

    private val chatClient = chatClientBuilder.build()

    override fun isInappropriate(text: String): Boolean {
        val answer = chatClient.prompt()
            .system(SYSTEM_PROMPT)
            .user(text)
            .call()
            .content()
            ?.trim()
            ?.uppercase()

        if (answer != BLOCK && answer != PASS) {
            log.warn { "검수 응답을 알아볼 수 없다. answer=$answer" }
            return false
        }

        return answer == BLOCK
    }

    companion object {

        private const val BLOCK = "BLOCK"
        private const val PASS = "PASS"

        private val SYSTEM_PROMPT = """
            너는 데이팅 앱의 자기소개와 코멘트를 검수한다.
            아래 중 하나라도 해당하면 BLOCK, 아니면 PASS 한 단어만 답한다.

            1. 성적인 내용: 노골적인 성적 표현, 성매매 암시
            2. 욕설과 혐오 표현: 욕설, 특정 집단 비하
            3. 연락처 노출: 카카오톡 아이디, 전화번호, 인스타그램 아이디 등 외부 유도
            4. 광고와 홍보: 상업적 홍보, 다른 서비스 유도

            판단이 애매하면 PASS 한다.
            취미, 관심사, 성격, 일상은 모두 PASS 한다.
        """.trimIndent()
    }
}
