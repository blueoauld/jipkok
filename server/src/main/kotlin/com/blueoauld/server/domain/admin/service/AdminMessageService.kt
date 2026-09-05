package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.response.AdminMessagePageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMessageResponse
import com.blueoauld.server.domain.auth.dto.SmsMessageStatus
import com.blueoauld.server.domain.auth.service.SmsMessageLog
import com.blueoauld.server.domain.auth.service.SolapiVerificationCodeSender
import org.springframework.stereotype.Service

@Service
class AdminMessageService(

    private val smsMessageLog: SmsMessageLog,
) {

    fun findMessages(to: String?, status: SmsMessageStatus?, startKey: String?, size: Int): AdminMessagePageResponse {
        val trimmed = to?.trim()?.takeIf { it.isNotEmpty() }
        val recipient = trimmed?.let { recipientOf(it) ?: return EMPTY }

        val page = smsMessageLog.find(recipient, status, startKey, AdminPaging.size(size))

        return AdminMessagePageResponse(
            items = page.messages.map {
                AdminMessageResponse(
                    messageId = it.messageId,
                    to = it.to,
                    from = it.from,
                    text = it.text,
                    type = it.type,
                    status = it.status,
                    statusCode = it.statusCode,
                    createdAt = it.createdAt,
                    receivedAt = it.receivedAt,
                )
            },
            nextKey = page.nextKey,
        )
    }

    private fun recipientOf(to: String): String? {
        if (!to.startsWith(PLUS)) {
            return to
        }

        val dialCode = SolapiVerificationCodeSender.dialCodeOf(to) ?: return null

        return SolapiVerificationCodeSender.nationalOf(to, dialCode)
    }

    companion object {

        private const val PLUS = "+"

        private val EMPTY = AdminMessagePageResponse(items = emptyList(), nextKey = null)
    }
}
