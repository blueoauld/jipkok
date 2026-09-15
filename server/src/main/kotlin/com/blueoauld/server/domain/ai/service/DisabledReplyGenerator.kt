package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiSummaryContext
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("'\${spring.ai.openai.api-key:}'.isEmpty()")
class DisabledReplyGenerator : AiReplyGenerator {

    override fun generate(context: AiReplyContext): AiReply? {
        log.warn { "OpenAI 키가 없어 AI 응답을 만들지 않는다. aiMemberId=${context.ai.id}" }

        return null
    }

    override fun greet(context: AiGreetingContext): AiReply? {
        log.warn { "OpenAI 키가 없어 AI 첫 쪽지를 만들지 않는다. aiMemberId=${context.ai.id}" }

        return null
    }

    override fun summarize(context: AiSummaryContext): AiReply? = null
}
