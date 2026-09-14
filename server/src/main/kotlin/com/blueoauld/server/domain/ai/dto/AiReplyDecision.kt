package com.blueoauld.server.domain.ai.dto

import java.time.Instant

sealed interface AiReplyDecision {

    data class Reply(val context: AiReplyContext) : AiReplyDecision

    data class Postpone(val dueAt: Instant) : AiReplyDecision

    data class Drop(val reason: String) : AiReplyDecision
}
