package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode

fun ChatRoomRepository.getRoomOf(memberId: Long, roomId: Long): ChatRoom = findById(roomId)
    .filter { it.contains(memberId) }
    .orElseThrow { BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND) }
