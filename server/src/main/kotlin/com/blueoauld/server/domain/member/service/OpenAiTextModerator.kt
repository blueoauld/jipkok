package com.blueoauld.server.domain.member.service

import org.springframework.ai.chat.client.ChatClient
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

@Component
@ConditionalOnExpression("!'\${spring.ai.openai.api-key:}'.isEmpty()")
class OpenAiTextModerator(

    chatClientBuilder: ChatClient.Builder,
) : TextModerator {

    private val chatClient = chatClientBuilder.build()

    override fun moderate(text: String): ModerationResult =
        chatClient.prompt()
            .system(SYSTEM_PROMPT)
            .user(text)
            .call()
            .entity(ModerationResult::class.java)
            ?: ModerationResult.PASSED

    companion object {

        private val SYSTEM_PROMPT = """
            너는 데이팅 앱의 자기소개와 코멘트를 검수한다.

            아래 중 하나라도 해당하면 inappropriate 를 true 로 하고 category 를 고른다.

            SEXUAL: 노골적인 성적 표현, 성매매 암시
            ABUSE: 욕설, 특정 집단 비하
            CONTACT: 카카오톡 아이디, 전화번호, 인스타그램 아이디 등 외부 유도
            ADVERTISEMENT: 상업적 홍보, 다른 서비스 유도

            해당하지 않으면 inappropriate 를 false 로 하고 category 를 NONE 으로 한다.

            판단이 애매하면 통과시킨다.
            취미, 관심사, 성격, 일상은 모두 통과시킨다.
        """.trimIndent()
    }
}
