package com.blueoauld.server.domain.ai.dto

import java.time.Instant

sealed interface AiGreetingDecision {

    data class Send(val context: AiGreetingContext) : AiGreetingDecision

    data class Postpone(val dueAt: Instant) : AiGreetingDecision

    data class Drop(val reason: String) : AiGreetingDecision
}
