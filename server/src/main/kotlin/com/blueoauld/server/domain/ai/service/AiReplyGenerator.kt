package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyContext

fun interface AiReplyGenerator {

    fun generate(context: AiReplyContext): String?
}
