package com.blueoauld.server.domain.chat.web

import com.blueoauld.server.domain.chat.dto.request.MarkReadRequest
import com.blueoauld.server.domain.chat.dto.request.MarkRoomsReadRequest
import com.blueoauld.server.domain.chat.dto.request.ReactMessageRequest
import com.blueoauld.server.domain.chat.dto.request.SendMessageRequest
import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.dto.response.ChatReactionsResponse
import com.blueoauld.server.domain.chat.dto.response.ChatVideoUrlResponse
import com.blueoauld.server.domain.chat.service.ChatMessageService
import com.blueoauld.server.domain.chat.service.ChatReactionService
import com.blueoauld.server.domain.chat.service.ChatRoomService
import com.blueoauld.server.domain.photo.dto.request.CreatePhotoUploadUrlRequest
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.global.response.CursorResponse
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/chats")
class ChatMessageController(

    private val chatMessageService: ChatMessageService,
    private val chatReactionService: ChatReactionService,
    private val chatRoomService: ChatRoomService,
) {

    @Operation(summary = "메시지 목록 조회", description = "최근 메시지부터 준다.")
    @GetMapping("/{roomId}/messages")
    fun findMessages(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<ChatMessageResponse> = chatMessageService.findMessages(memberId, roomId, cursor, size)

    @Operation(
        operationId = "findChatMedia",
        summary = "사진, 동영상 모아보기",
        description = "방의 사진과 동영상 메시지만 최근 것부터 준다. 답글 원문과 반응은 담지 않는다.",
    )
    @GetMapping("/{roomId}/media")
    fun findMedia(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<ChatMessageResponse> = chatMessageService.findMedia(memberId, roomId, cursor, size)

    @Operation(operationId = "sendChatMessage", summary = "메시지 전송", description = "사진은 한 장에 메시지 하나다.")
    @PostMapping("/{roomId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    fun send(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @Valid @RequestBody request: SendMessageRequest,
    ): ChatMessageResponse = chatMessageService.send(memberId, roomId, request)

    @Operation(operationId = "reactChatMessage", summary = "메시지에 반응", description = "이미 반응했으면 바꾼다.")
    @PutMapping("/{roomId}/messages/{messageId}/reaction")
    fun react(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @PathVariable messageId: Long,
        @Valid @RequestBody request: ReactMessageRequest,
    ): ChatReactionsResponse = chatReactionService.react(memberId, roomId, messageId, request)

    @Operation(operationId = "unreactChatMessage", summary = "메시지 반응 취소")
    @DeleteMapping("/{roomId}/messages/{messageId}/reaction")
    fun unreact(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @PathVariable messageId: Long,
    ): ChatReactionsResponse = chatReactionService.unreact(memberId, roomId, messageId)

    @Operation(summary = "읽음 처리")
    @PostMapping("/{roomId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun markRead(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @Valid @RequestBody request: MarkReadRequest,
    ) {
        chatRoomService.markRead(memberId, roomId, request.lastReadMessageId)
    }

    @Operation(summary = "여러 방 읽음 처리", description = "각 방의 마지막 메시지까지 읽은 것으로 본다. 없는 방은 건너뛴다.")
    @PostMapping("/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun markAllRead(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: MarkRoomsReadRequest,
    ) {
        chatRoomService.markAllRead(memberId, request.roomIds)
    }

    @Operation(
        operationId = "findChatVideoUrl",
        summary = "동영상 재생 URL 발급",
        description = "서명 URL은 짧게 만료되므로 재생 직전에 받는다.",
    )
    @GetMapping("/{roomId}/messages/{messageId}/video-url")
    fun findVideoUrl(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @PathVariable messageId: Long,
    ): ChatVideoUrlResponse = chatMessageService.findVideoUrl(memberId, roomId, messageId)

    @Operation(operationId = "createChatMediaUploadUrl", summary = "채팅 사진, 동영상 업로드 URL 발급")
    @PostMapping("/photos/upload-url")
    fun createMediaUploadUrl(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreatePhotoUploadUrlRequest,
    ): PhotoUploadUrlResponse = chatMessageService.createMediaUploadUrl(memberId, request)

    companion object {

        private const val DEFAULT_PAGE_SIZE = 30
    }
}
