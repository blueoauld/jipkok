package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.response.AdminMessagePageResponse
import com.blueoauld.server.domain.admin.service.AdminMessageService
import com.blueoauld.server.domain.auth.dto.SmsMessageStatus
import io.swagger.v3.oas.annotations.Operation
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/messages")
class AdminMessageController(

    private val adminMessageService: AdminMessageService,
) {

    @Operation(
        summary = "문자 발송 내역",
        description = "솔라피에서 최신순으로 가져온다. 수신번호는 국제 표기(+82)든 국내 표기(010)든 받고, 다음 페이지는 nextKey를 startKey로 넘긴다.",
    )
    @GetMapping
    fun findMessages(
        @RequestParam(required = false) to: String?,
        @RequestParam(required = false) status: SmsMessageStatus?,
        @RequestParam(required = false) startKey: String?,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminMessagePageResponse = adminMessageService.findMessages(to, status, startKey, size)
}
