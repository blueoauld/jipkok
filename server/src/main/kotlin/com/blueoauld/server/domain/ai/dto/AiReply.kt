package com.blueoauld.server.domain.ai.dto

data class AiReply(

    val content: String,
    val promptTokens: Int,
    val completionTokens: Int,
    val cachedTokens: Int,
    val model: String?,
)
