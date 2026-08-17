package com.blueoauld.server.domain.chat.dto.response

data class ChatEventResponse(

    val type: ChatEventType,
    val roomId: Long,
    val message: ChatMessageResponse? = null,
    val reaction: ChatReactionsResponse? = null,
) {

    companion object {

        fun message(message: ChatMessageResponse) = ChatEventResponse(
            type = ChatEventType.MESSAGE,
            roomId = message.roomId,
            message = message,
        )

        fun reaction(roomId: Long, reactions: ChatReactionsResponse) = ChatEventResponse(
            type = ChatEventType.REACTION,
            roomId = roomId,
            reaction = reactions,
        )

        fun roomDeleted(roomId: Long) = ChatEventResponse(
            type = ChatEventType.ROOM_DELETED,
            roomId = roomId,
        )
    }
}
