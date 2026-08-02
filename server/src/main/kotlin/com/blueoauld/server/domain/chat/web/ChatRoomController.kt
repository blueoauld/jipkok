package com.blueoauld.server.domain.chat.web

import com.blueoauld.server.domain.chat.service.ChatRoomService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/chats")
class ChatRoomController(

    private val chatRoomService: ChatRoomService,
) {

    @Operation(summary = "채팅방 나가기", description = "방과 대화 내역이 양쪽 모두에서 사라진다.")
    @DeleteMapping("/{roomId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun leave(@AuthenticationPrincipal memberId: Long, @PathVariable roomId: Long) {
        chatRoomService.leave(memberId, roomId)
    }
}
