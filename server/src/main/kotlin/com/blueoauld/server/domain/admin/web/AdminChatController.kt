package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.AdminChatRoomStatus
import com.blueoauld.server.domain.admin.dto.response.AdminChatMessagePageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminChatRoomDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminChatRoomPageResponse
import com.blueoauld.server.domain.admin.service.AdminChatService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin")
class AdminChatController(

    private val adminChatService: AdminChatService,
) {

    @Operation(
        operationId = "findAdminChatRooms",
        summary = "채팅방 목록",
        description = "마지막 메시지가 최근인 방부터 준다. 한쪽이 나가 삭제된 방도 90일 동안은 나오고, 회원 ID를 주면 그 회원이 속한 방만 준다.",
    )
    @GetMapping("/chat-rooms")
    fun findRooms(
        @RequestParam(required = false) status: AdminChatRoomStatus?,
        @RequestParam(required = false) memberId: Long?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminChatRoomPageResponse = adminChatService.findRooms(status, memberId, page, size)

    @Operation(operationId = "findAdminChatRoom", summary = "채팅방 상세", description = "삭제된 방도 준다.")
    @GetMapping("/chat-rooms/{roomId}")
    fun findRoom(@PathVariable roomId: Long): AdminChatRoomDetailResponse = adminChatService.findRoom(roomId)

    @Operation(
        operationId = "findAdminChatMessages",
        summary = "채팅방 메시지",
        description = "커서보다 오래된 메시지를 최신순으로 size만큼 잘라 시간순으로 준다. 더 있으면 nextCursor를 준다.",
    )
    @GetMapping("/chat-rooms/{roomId}/messages")
    fun findMessages(
        @PathVariable roomId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "50") size: Int,
    ): AdminChatMessagePageResponse = adminChatService.findMessages(roomId, cursor, size)
}
