package com.blueoauld.server.domain.chat.web

import com.blueoauld.server.domain.chat.dto.request.CreateChatPhotoUploadUrlRequest
import com.blueoauld.server.domain.chat.dto.request.MarkReadRequest
import com.blueoauld.server.domain.chat.dto.request.SendMessageRequest
import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.dto.response.ChatPhotoUploadUrlResponse
import com.blueoauld.server.domain.chat.service.ChatMessageService
import com.blueoauld.server.global.response.CursorResponse
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/chats")
class ChatMessageController(

    private val chatMessageService: ChatMessageService,
) {

    @Operation(summary = "메시지 목록 조회", description = "최근 메시지부터 준다.")
    @GetMapping("/{roomId}/messages")
    fun findMessages(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<ChatMessageResponse> = chatMessageService.findMessages(memberId, roomId, cursor, size)

    @Operation(operationId = "sendChatMessage", summary = "메시지 전송", description = "사진은 한 장에 메시지 하나다.")
    @PostMapping("/{roomId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    fun send(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @Valid @RequestBody request: SendMessageRequest,
    ): ChatMessageResponse = chatMessageService.send(memberId, roomId, request)

    @Operation(summary = "읽음 처리")
    @PostMapping("/{roomId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun markRead(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @RequestBody request: MarkReadRequest,
    ) {
        chatMessageService.markRead(memberId, roomId, request.lastReadMessageId)
    }

    @Operation(operationId = "createChatPhotoUploadUrl", summary = "채팅 사진 업로드 URL 발급")
    @PostMapping("/photos/upload-url")
    fun createPhotoUploadUrl(
        @AuthenticationPrincipal memberId: Long,
        @RequestBody request: CreateChatPhotoUploadUrlRequest,
    ): ChatPhotoUploadUrlResponse = chatMessageService.createPhotoUploadUrl(memberId, request)

    companion object {

        private const val DEFAULT_PAGE_SIZE = 30
    }
}
