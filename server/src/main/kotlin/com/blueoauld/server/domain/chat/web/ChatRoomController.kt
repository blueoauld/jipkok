package com.blueoauld.server.domain.chat.web

import com.blueoauld.server.domain.chat.dto.request.LeaveRoomsRequest
import com.blueoauld.server.domain.chat.dto.response.ChatRoomResponse
import com.blueoauld.server.domain.chat.service.ChatRoomService
import com.blueoauld.server.global.request.EnabledRequest
import com.blueoauld.server.global.response.CursorResponse
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/chats")
class ChatRoomController(

    private val chatRoomService: ChatRoomService,
) {

    @Operation(summary = "채팅방 목록 조회")
    @GetMapping
    fun findRooms(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(defaultValue = "false") unreadOnly: Boolean,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<ChatRoomResponse> = chatRoomService.findRooms(memberId, unreadOnly, cursor, size)

    @Operation(summary = "안읽은 메시지 수")
    @GetMapping("/unread-count")
    fun findUnreadCount(@AuthenticationPrincipal memberId: Long): Long = chatRoomService.findUnreadCount(memberId)

    @Operation(summary = "채팅방 검색", description = "상대 닉네임으로 찾는다.")
    @GetMapping("/search")
    fun searchRooms(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam keyword: String,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<ChatRoomResponse> = chatRoomService.searchRooms(memberId, keyword, cursor, size)

    @Operation(summary = "채팅방 조회")
    @GetMapping("/{roomId}")
    fun findRoom(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
    ): ChatRoomResponse = chatRoomService.findRoom(memberId, roomId)

    @Operation(summary = "채팅방 알림 설정")
    @PutMapping("/{roomId}/notification")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun updateNotification(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable roomId: Long,
        @Valid @RequestBody request: EnabledRequest,
    ) {
        chatRoomService.updateNotification(memberId, roomId, request)
    }

    @Operation(summary = "채팅방 나가기", description = "방과 대화 내역이 양쪽 모두에서 사라진다.")
    @DeleteMapping("/{roomId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun leave(@AuthenticationPrincipal memberId: Long, @PathVariable roomId: Long) {
        chatRoomService.leave(memberId, roomId)
    }

    @Operation(summary = "채팅방 여러 개 나가기", description = "내 방이 아니거나 이미 없어진 방은 건너뛴다.")
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun leaveAll(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: LeaveRoomsRequest,
    ) {
        chatRoomService.leaveAll(memberId, request.roomIds)
    }

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
