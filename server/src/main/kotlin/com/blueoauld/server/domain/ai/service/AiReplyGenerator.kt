package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiSummaryContext

interface AiReplyGenerator {

    fun generate(context: AiReplyContext): AiReply?

    fun summarize(context: AiSummaryContext): AiReply?
}
