package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyContext
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("'\${spring.ai.openai.api-key:}'.isEmpty()")
class DisabledReplyGenerator : AiReplyGenerator {

    override fun generate(context: AiReplyContext): String? {
        log.warn { "OpenAI 키가 없어 AI 응답을 만들지 않는다. aiMemberId=${context.ai.id}" }

        return null
    }
}
