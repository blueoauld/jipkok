package com.blueoauld.server.domain.chat.dto.request

import com.blueoauld.server.domain.chat.entity.ChatRoom
import jakarta.validation.constraints.Size

data class MarkRoomsReadRequest(

    @field:Size(max = ChatRoom.BULK_MAX_COUNT, message = "한 번에 읽음 처리할 수 있는 방 수를 넘었습니다.")
    val roomIds: List<Long>,
)
