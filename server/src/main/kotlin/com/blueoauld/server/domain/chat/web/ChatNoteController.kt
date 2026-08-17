package com.blueoauld.server.domain.chat.web

import com.blueoauld.server.domain.chat.dto.request.SendNoteRequest
import com.blueoauld.server.domain.chat.service.ChatNoteService
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members")
class ChatNoteController(

    private val chatNoteService: ChatNoteService,
) {

    @Operation(operationId = "sendNote", summary = "쪽지 전송", description = "채팅방이 없으면 새로 만들고 포인트를 차감한다.")
    @PostMapping("/{memberId}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    fun send(
        @AuthenticationPrincipal senderId: Long,
        @PathVariable memberId: Long,
        @Valid @RequestBody request: SendNoteRequest,
    ) {
        chatNoteService.send(senderId, memberId, request.content)
    }
}
