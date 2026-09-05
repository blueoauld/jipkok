package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.dto.SmsMessageStatus
import com.blueoauld.server.domain.auth.service.SolapiSmsMessageLog.Companion.toSmsMessage
import com.solapi.sdk.message.model.Message
import com.solapi.sdk.message.model.MessageType
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant

class SolapiSmsMessageLogTest {

    @Test
    fun `솔라피 메시지를 발송 내역으로 옮긴다`() {
        // given
        val message = Message().apply {
            messageId = "M1"
            to = "01012345678"
            from = "0212345678"
            text = "JIPKOK Verification Code: 123456"
            type = MessageType.SMS
            status = "COMPLETE"
            statusCode = "4000"
            dateCreated = "2026-09-05T00:00:00.000Z"
            dateReceived = "2026-09-05T00:00:03.000Z"
        }

        // when
        val sms = toSmsMessage(message)

        // then
        assertThat(sms.messageId).isEqualTo("M1")
        assertThat(sms.to).isEqualTo("01012345678")
        assertThat(sms.type).isEqualTo("SMS")
        assertThat(sms.status).isEqualTo(SmsMessageStatus.COMPLETE)
        assertThat(sms.statusCode).isEqualTo("4000")
        assertThat(sms.createdAt).isEqualTo(Instant.parse("2026-09-05T00:00:00Z"))
        assertThat(sms.receivedAt).isEqualTo(Instant.parse("2026-09-05T00:00:03Z"))
    }

    @Test
    fun `모르는 상태와 깨진 날짜는 비워 둔다`() {
        // given
        val message = Message().apply {
            messageId = "M2"
            to = "01012345678"
            status = "UNKNOWN"
            dateCreated = "not-a-date"
        }

        // when
        val sms = toSmsMessage(message)

        // then
        assertThat(sms.status).isNull()
        assertThat(sms.createdAt).isNull()
        assertThat(sms.receivedAt).isNull()
    }
}
