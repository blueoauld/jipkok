package com.blueoauld.server.domain.auth.dto

import java.time.Instant

data class SmsMessagePage(

    val messages: List<SmsMessage>,
    val nextKey: String?,
)

data class SmsMessage(

    val messageId: String,
    val to: String,
    val from: String?,
    val text: String?,
    val type: String?,
    val status: SmsMessageStatus?,
    val statusCode: String?,
    val createdAt: Instant?,
    val receivedAt: Instant?,
)
