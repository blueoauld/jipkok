package com.blueoauld.server.domain.chat.web

import com.blueoauld.server.domain.chat.dto.response.ChatRoomResponse
import com.blueoauld.server.domain.chat.service.ChatRoomService
import com.blueoauld.server.global.response.CursorResponse
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
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

    @Operation(summary = "채팅방 검색", description = "상대 닉네임으로 찾는다.")
    @GetMapping("/search")
    fun searchRooms(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam keyword: String,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<ChatRoomResponse> = chatRoomService.searchRooms(memberId, keyword, cursor, size)

    @Operation(summary = "채팅방 나가기", description = "방과 대화 내역이 양쪽 모두에서 사라진다.")
    @DeleteMapping("/{roomId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun leave(@AuthenticationPrincipal memberId: Long, @PathVariable roomId: Long) {
        chatRoomService.leave(memberId, roomId)
    }

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
