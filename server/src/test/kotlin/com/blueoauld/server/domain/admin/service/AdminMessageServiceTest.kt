package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.auth.dto.SmsMessage
import com.blueoauld.server.domain.auth.dto.SmsMessagePage
import com.blueoauld.server.domain.auth.dto.SmsMessageStatus
import com.blueoauld.server.domain.auth.service.SmsMessageLog
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant

class AdminMessageServiceTest {

    private val smsMessageLog = mockk<SmsMessageLog>()

    private val adminMessageService = AdminMessageService(smsMessageLog)

    @Test
    fun `국제 표기 번호는 국내 표기로 바꿔 조회한다`() {
        // given
        every { smsMessageLog.find("01012345678", null, null, 20) } returns page()

        // when
        val response = adminMessageService.findMessages(" +821012345678 ", null, null, 20)

        // then
        assertThat(response.items).hasSize(1)
        assertThat(response.items.single().to).isEqualTo("01012345678")
        assertThat(response.nextKey).isEqualTo("next")
    }

    @Test
    fun `국내 표기 번호와 상태, 시작 키는 그대로 넘긴다`() {
        // given
        every { smsMessageLog.find("01012345678", SmsMessageStatus.FAILED, "key", 20) } returns page()

        // when
        adminMessageService.findMessages("01012345678", SmsMessageStatus.FAILED, "key", 20)

        // then
        verify { smsMessageLog.find("01012345678", SmsMessageStatus.FAILED, "key", 20) }
    }

    @Test
    fun `보낼 수 없는 나라 번호는 조회하지 않고 빈 목록을 준다`() {
        // when
        val response = adminMessageService.findMessages("+14155552671", null, null, 20)

        // then
        assertThat(response.items).isEmpty()
        assertThat(response.nextKey).isNull()
        verify(exactly = 0) { smsMessageLog.find(any(), any(), any(), any()) }
    }

    @Test
    fun `번호가 비어 있으면 조건 없이 조회하고 크기는 상한 안으로 맞춘다`() {
        // given
        every { smsMessageLog.find(null, null, null, AdminPaging.MAX_SIZE) } returns page()

        // when
        adminMessageService.findMessages("  ", null, null, 1000)

        // then
        verify { smsMessageLog.find(null, null, null, AdminPaging.MAX_SIZE) }
    }

    private fun page() = SmsMessagePage(
        messages = listOf(
            SmsMessage(
                messageId = "M1",
                to = "01012345678",
                from = "0212345678",
                text = "JIPKOK Verification Code: 123456",
                type = "SMS",
                status = SmsMessageStatus.COMPLETE,
                statusCode = "4000",
                createdAt = Instant.parse("2026-09-05T00:00:00Z"),
                receivedAt = Instant.parse("2026-09-05T00:00:03Z"),
            ),
        ),
        nextKey = "next",
    )
}
