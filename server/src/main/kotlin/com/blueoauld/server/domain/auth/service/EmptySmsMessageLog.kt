package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.dto.SmsMessagePage
import com.blueoauld.server.domain.auth.dto.SmsMessageStatus
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

@Component
@ConditionalOnExpression("'\${solapi.api-key:}'.isEmpty()")
class EmptySmsMessageLog : SmsMessageLog {

    override fun find(to: String?, status: SmsMessageStatus?, startKey: String?, limit: Int) =
        SmsMessagePage(messages = emptyList(), nextKey = null)
}
