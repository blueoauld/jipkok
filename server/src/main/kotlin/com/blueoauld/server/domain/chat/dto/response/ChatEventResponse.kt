package com.blueoauld.server.domain.chat.dto.response

data class ChatEventResponse(

    val type: ChatEventType,
    val roomId: Long,
    val message: ChatMessageResponse? = null,
) {

    companion object {

        fun message(message: ChatMessageResponse) = ChatEventResponse(
            type = ChatEventType.MESSAGE,
            roomId = message.roomId,
            message = message,
        )

        fun roomDeleted(roomId: Long) = ChatEventResponse(
            type = ChatEventType.ROOM_DELETED,
            roomId = roomId,
        )
    }
}
