package com.blueoauld.server.domain.chat.event

data class ChatRoomDeletedEvent(

    val receiverId: Long,
    val roomId: Long,
)
