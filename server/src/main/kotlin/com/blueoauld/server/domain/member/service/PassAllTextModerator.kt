package com.blueoauld.server.domain.member.service

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

@Component
@ConditionalOnExpression("'\${spring.ai.openai.api-key:}'.isEmpty()")
class PassAllTextModerator : TextModerator {

    override fun moderate(text: String) = ModerationResult.PASSED
}
