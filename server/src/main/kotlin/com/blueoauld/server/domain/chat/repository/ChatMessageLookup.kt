package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode

fun ChatMessageRepository.getMessageOf(roomId: Long, messageId: Long): ChatMessage = findById(messageId)
    .filter { it.roomId == roomId }
    .orElseThrow { BusinessException(ErrorCode.CHAT_MESSAGE_NOT_FOUND) }
