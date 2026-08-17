package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.request.CreateChatPhotoUploadUrlRequest
import com.blueoauld.server.domain.chat.dto.request.ReactMessageRequest
import com.blueoauld.server.domain.chat.dto.request.SendMessageRequest
import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.dto.response.ChatPhotoUploadUrlResponse
import com.blueoauld.server.domain.chat.dto.response.ChatReactionResponse
import com.blueoauld.server.domain.chat.dto.response.ChatReactionsResponse
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatMessageReaction
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.event.ChatReactionChangedEvent
import com.blueoauld.server.domain.chat.repository.ChatMessageReactionRepository
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
    private val chatMessageReactionRepository: ChatMessageReactionRepository,
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

        val originals = messages.mapNotNull { it.replyToMessageId }
            .ifEmpty { null }
            ?.let { chatMessageRepository.findAllById(it) }
            ?.associateBy { it.id }
            .orEmpty()

        val reactions = messages.ifEmpty { null }
            ?.let { chatMessageReactionRepository.findByMessageIdIn(it.map(ChatMessage::id)) }
            .orEmpty()
            .groupBy({ it.messageId }, ChatReactionResponse::of)

        return CursorResponse(
            items = messages.map { message ->
                ChatMessageResponse.of(
                    message,
                    message.objectKey?.let(photoStorage::createSignedViewUrl),
                    message.replyToMessageId?.let(originals::get)?.let(::toReplyResponse),
                    reactions[message.id].orEmpty(),
                )
            },
            nextCursor = messages.lastOrNull()?.id.takeIf { messages.size == pageSize },
        )
    }

    @Transactional
    fun send(memberId: Long, roomId: Long, request: SendMessageRequest): ChatMessageResponse {
        val room = findRoom(memberId, roomId)

        findAlreadySent(roomId, request.clientMessageId)?.let { return it }

        val replyTarget = findReplyTarget(roomId, request.replyToMessageId)

        return append(room, memberId, toMessage(memberId, roomId, request, replyTarget), replyTarget)
    }

    @Transactional
    fun react(memberId: Long, roomId: Long, messageId: Long, request: ReactMessageRequest): ChatReactionsResponse {
        val room = findRoom(memberId, roomId)
        val message = findMessage(roomId, messageId)

        val reaction = chatMessageReactionRepository.findByMessageIdAndMemberId(message.id, memberId)
            ?.also { it.type = request.type }
            ?: chatMessageReactionRepository.save(
                ChatMessageReaction(
                    roomId = roomId,
                    messageId = message.id,
                    memberId = memberId,
                    type = request.type,
                ),
            )
        chatMessageReactionRepository.flush()

        return publishReactions(room, memberId, message)
    }

    @Transactional
    fun unreact(memberId: Long, roomId: Long, messageId: Long): ChatReactionsResponse {
        val room = findRoom(memberId, roomId)
        val message = findMessage(roomId, messageId)

        chatMessageReactionRepository.findByMessageIdAndMemberId(message.id, memberId)?.let {
            chatMessageReactionRepository.delete(it)
            chatMessageReactionRepository.flush()
        }

        return publishReactions(room, memberId, message)
    }

    @Transactional
    fun markRead(memberId: Long, roomId: Long, lastReadMessageId: Long) {
        findRoom(memberId, roomId)
        chatRoomMemberRepository.markRead(roomId, memberId, lastReadMessageId)
    }

    @Transactional
    fun markAllRead(memberId: Long, roomIds: List<Long>) {
        if (roomIds.isEmpty()) {
            return
        }

        chatRoomMemberRepository.markAllRead(memberId, roomIds)
    }

    @Transactional
    fun append(
        room: ChatRoom,
        senderId: Long,
        message: ChatMessage,
        replyTarget: ChatMessage? = null,
    ): ChatMessageResponse {
        val saved = chatMessageRepository.save(message)
        val partnerId = room.partnerIdOf(senderId)

        room.lastMessageId = saved.id
        chatRoomMemberRepository.increaseUnreadCount(room.id, partnerId)
        saved.objectKey?.let { photoUploadService.confirm(listOf(it)) }

        val response = ChatMessageResponse.of(
            saved,
            saved.objectKey?.let(photoStorage::createSignedViewUrl),
            replyTarget?.let(::toReplyResponse),
        )

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

    private fun findMessage(roomId: Long, messageId: Long) = chatMessageRepository.findById(messageId)
        .filter { it.roomId == roomId }
        .orElseThrow { BusinessException(ErrorCode.CHAT_MESSAGE_NOT_FOUND) }

    private fun publishReactions(room: ChatRoom, memberId: Long, message: ChatMessage): ChatReactionsResponse {
        val response = ChatReactionsResponse(
            messageId = message.id,
            reactions = chatMessageReactionRepository.findByMessageId(message.id).map(ChatReactionResponse::of),
        )

        eventPublisher.publishEvent(ChatReactionChangedEvent(room.partnerIdOf(memberId), message.roomId, response))

        return response
    }

    private fun findAlreadySent(roomId: Long, clientMessageId: String?): ChatMessageResponse? {
        val message = clientMessageId
            ?.let { chatMessageRepository.findByRoomIdAndClientMessageId(roomId, it) }
            ?: return null

        return ChatMessageResponse.of(
            message,
            message.objectKey?.let(photoStorage::createSignedViewUrl),
            message.replyToMessageId
                ?.let { chatMessageRepository.findById(it).orElse(null) }
                ?.let(::toReplyResponse),
        )
    }

    private fun findReplyTarget(roomId: Long, replyToMessageId: Long?): ChatMessage? {
        if (replyToMessageId == null) {
            return null
        }

        return chatMessageRepository.findById(replyToMessageId)
            .filter { it.roomId == roomId }
            .orElseThrow { BusinessException(ErrorCode.REPLY_TARGET_NOT_FOUND) }
    }

    private fun toReplyResponse(original: ChatMessage) = ChatMessageResponse.ReplyMessageResponse.of(
        original,
        original.objectKey?.let(photoStorage::createSignedViewUrl),
    )

    private fun toMessage(
        memberId: Long,
        roomId: Long,
        request: SendMessageRequest,
        replyTarget: ChatMessage?,
    ) = when (request.type) {
        ChatMessageType.TEXT -> ChatMessage(
            roomId = roomId,
            senderId = memberId,
            type = ChatMessageType.TEXT,
            content = request.content?.trim()?.ifEmpty { null } ?: throw BusinessException(ErrorCode.INVALID_REQUEST),
            replyToMessageId = replyTarget?.id,
            clientMessageId = request.clientMessageId,
        )

        ChatMessageType.PHOTO -> ChatMessage(
            roomId = roomId,
            senderId = memberId,
            type = ChatMessageType.PHOTO,
            objectKey = validatePhotoKey(memberId, request.objectKey),
            replyToMessageId = replyTarget?.id,
            clientMessageId = request.clientMessageId,
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
