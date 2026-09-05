package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.auth.dto.SmsMessageStatus
import java.time.Instant

data class AdminMessagePageResponse(

    val items: List<AdminMessageResponse>,
    val nextKey: String?,
)

data class AdminMessageResponse(

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
