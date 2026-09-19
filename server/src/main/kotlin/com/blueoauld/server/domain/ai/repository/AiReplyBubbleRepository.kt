package com.blueoauld.server.domain.ai.repository

import com.blueoauld.server.domain.ai.entity.AiReplyBubble
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface AiReplyBubbleRepository : JpaRepository<AiReplyBubble, Long> {

    fun findAllByDueAtLessThanEqualOrderByDueAtAscIdAsc(threshold: Instant, limit: Limit): List<AiReplyBubble>
}
