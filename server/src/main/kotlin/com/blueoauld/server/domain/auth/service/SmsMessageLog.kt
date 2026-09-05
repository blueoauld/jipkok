package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.dto.SmsMessagePage
import com.blueoauld.server.domain.auth.dto.SmsMessageStatus

interface SmsMessageLog {

    fun find(to: String?, status: SmsMessageStatus?, startKey: String?, limit: Int): SmsMessagePage
}
