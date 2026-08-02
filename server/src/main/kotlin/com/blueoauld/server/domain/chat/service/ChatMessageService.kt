package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.request.CreateChatPhotoUploadUrlRequest
import com.blueoauld.server.domain.chat.dto.request.SendMessageRequest
import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.dto.response.ChatPhotoUploadUrlResponse
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatMessageService(

    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val photoUploadService: PhotoUploadService,
    private val photoStorage: PhotoStorage,
    private val eventPublisher: ApplicationEventPublisher,
) {

    @Transactional(readOnly = true)
    fun findMessages(
        memberId: Long,
        roomId: Long,
        cursor: Long?,
        size: Int,
    ): CursorResponse<ChatMessageResponse> {
        findRoom(memberId, roomId)

        val pageSize = CursorResponse.pageSize(size)
        val messages = chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(
            roomId,
            cursor ?: Long.MAX_VALUE,
            Limit.of(pageSize),
        )

        return CursorResponse(
            items = messages.map { ChatMessageResponse.of(it, it.objectKey?.let(photoStorage::createSignedViewUrl)) },
            nextCursor = messages.lastOrNull()?.id.takeIf { messages.size == pageSize },
        )
    }

    @Transactional
    fun send(memberId: Long, roomId: Long, request: SendMessageRequest): ChatMessageResponse =
        append(findRoom(memberId, roomId), memberId, toMessage(memberId, roomId, request))

    @Transactional
    fun markRead(memberId: Long, roomId: Long, lastReadMessageId: Long) {
        findRoom(memberId, roomId)
        chatRoomMemberRepository.markRead(roomId, memberId, lastReadMessageId)
    }

    @Transactional
    fun append(room: ChatRoom, senderId: Long, message: ChatMessage): ChatMessageResponse {
        val saved = chatMessageRepository.save(message)
        val partnerId = room.partnerIdOf(senderId)

        room.lastMessageId = saved.id
        chatRoomMemberRepository.increaseUnreadCount(room.id, partnerId)
        saved.objectKey?.let { photoUploadService.confirm(listOf(it)) }

        val response = ChatMessageResponse.of(saved, saved.objectKey?.let(photoStorage::createSignedViewUrl))

        eventPublisher.publishEvent(ChatMessageSentEvent(partnerId, response))

        return response
    }

    fun createPhotoUploadUrl(memberId: Long, request: CreateChatPhotoUploadUrlRequest): ChatPhotoUploadUrlResponse {
        val issued = photoUploadService.createUploadUrl(memberId, photoKeyPrefix(memberId), request.contentType)

        return ChatPhotoUploadUrlResponse(issued.uploadUrl, issued.objectKey)
    }

    private fun findRoom(memberId: Long, roomId: Long) = chatRoomRepository.findById(roomId)
        .filter { it.contains(memberId) }
        .orElseThrow { BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND) }

    private fun toMessage(memberId: Long, roomId: Long, request: SendMessageRequest) = when (request.type) {
        ChatMessageType.TEXT -> ChatMessage(
            roomId = roomId,
            senderId = memberId,
            type = ChatMessageType.TEXT,
            content = request.content?.trim()?.ifEmpty { null } ?: throw BusinessException(ErrorCode.INVALID_REQUEST),
        )

        ChatMessageType.PHOTO -> ChatMessage(
            roomId = roomId,
            senderId = memberId,
            type = ChatMessageType.PHOTO,
            objectKey = validatePhotoKey(memberId, request.objectKey),
        )
    }

    private fun validatePhotoKey(memberId: Long, objectKey: String?): String {
        if (objectKey == null || !objectKey.startsWith(photoKeyPrefix(memberId))) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }

        return objectKey
    }

    private fun photoKeyPrefix(memberId: Long) = "$PHOTO_KEY_ROOT/$memberId/"

    companion object {

        private const val PHOTO_KEY_ROOT = "chats"
    }
}
