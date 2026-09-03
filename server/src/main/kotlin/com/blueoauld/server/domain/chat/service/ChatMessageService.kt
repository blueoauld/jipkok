package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.request.SendMessageRequest
import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.dto.response.ChatVideoUrlResponse
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.repository.getMessageOf
import com.blueoauld.server.domain.chat.repository.getRoomOf
import com.blueoauld.server.domain.photo.dto.request.CreatePhotoUploadUrlRequest
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.photo.service.PhotoUploadService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.storage.service.PhotoStorage
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatMessageService(

    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val chatReactionService: ChatReactionService,
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
        chatRoomRepository.getRoomOf(memberId, roomId)

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

        val reactions = chatReactionService.findByMessageIds(messages.map(ChatMessage::id))

        return CursorResponse(
            items = messages.map { message ->
                ChatMessageResponse.of(
                    message,
                    toMediaUrls(message),
                    message.replyToMessageId?.let(originals::get)?.let(::toReplyResponse),
                    reactions[message.id].orEmpty(),
                )
            },
            nextCursor = messages.lastOrNull()?.id.takeIf { messages.size == pageSize },
        )
    }

    @Transactional(readOnly = true)
    fun findMedia(
        memberId: Long,
        roomId: Long,
        cursor: Long?,
        size: Int,
    ): CursorResponse<ChatMessageResponse> {
        chatRoomRepository.getRoomOf(memberId, roomId)

        val pageSize = CursorResponse.pageSize(size)
        val messages = chatMessageRepository.findByRoomIdAndTypeInAndIdLessThanOrderByIdDesc(
            roomId,
            MEDIA_TYPES,
            cursor ?: Long.MAX_VALUE,
            Limit.of(pageSize),
        )

        return CursorResponse(
            items = messages.map { ChatMessageResponse.of(it, toMediaUrls(it)) },
            nextCursor = messages.lastOrNull()?.id.takeIf { messages.size == pageSize },
        )
    }

    @Transactional
    fun send(memberId: Long, roomId: Long, request: SendMessageRequest): ChatMessageResponse {
        val room = chatRoomRepository.getRoomOf(memberId, roomId)

        findAlreadySent(roomId, request.clientMessageId)?.let { return it }

        val replyTarget = findReplyTarget(roomId, request.replyToMessageId)

        return append(room, memberId, toMessage(memberId, roomId, request, replyTarget), replyTarget)
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
        chatRoomMemberRepository.applyLastMessage(room.id, saved.id, partnerId)
        photoUploadService.confirm(listOfNotNull(saved.objectKey, saved.thumbnailObjectKey))

        val response = ChatMessageResponse.of(saved, toMediaUrls(saved), replyTarget?.let(::toReplyResponse))

        eventPublisher.publishEvent(ChatMessageSentEvent(partnerId, response))

        return response
    }

    fun createMediaUploadUrl(memberId: Long, request: CreatePhotoUploadUrlRequest): PhotoUploadUrlResponse =
        photoUploadService.createMediaUploadUrl(memberId, photoKeyPrefix(memberId), request.contentType)

    @Transactional(readOnly = true)
    fun findVideoUrl(memberId: Long, roomId: Long, messageId: Long): ChatVideoUrlResponse {
        chatRoomRepository.getRoomOf(memberId, roomId)
        val message = chatMessageRepository.getMessageOf(roomId, messageId)
        val objectKey = message.objectKey?.takeIf { message.type == ChatMessageType.VIDEO }
            ?: throw BusinessException(ErrorCode.NOT_VIDEO_MESSAGE)

        return ChatVideoUrlResponse(photoStorage.createSignedViewUrl(objectKey))
    }

    private fun toMediaUrls(message: ChatMessage) = when (message.type) {
        ChatMessageType.TEXT -> ChatMessageResponse.MediaUrls.NONE
        ChatMessageType.PHOTO -> ChatMessageResponse.MediaUrls(
            imageUrl = message.objectKey?.let(photoStorage::createSignedViewUrl),
        )

        ChatMessageType.VIDEO -> ChatMessageResponse.MediaUrls(
            videoUrl = message.objectKey?.let(photoStorage::createSignedViewUrl),
            thumbnailUrl = message.thumbnailObjectKey?.let(photoStorage::createSignedViewUrl),
        )
    }

    private fun findAlreadySent(roomId: Long, clientMessageId: String?): ChatMessageResponse? {
        val message = clientMessageId
            ?.let { chatMessageRepository.findByRoomIdAndClientMessageId(roomId, it) }
            ?: return null

        return ChatMessageResponse.of(
            message,
            toMediaUrls(message),
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
        previewKeyOf(original)?.let(photoStorage::createSignedViewUrl),
    )

    private fun previewKeyOf(message: ChatMessage) = when (message.type) {
        ChatMessageType.TEXT -> null
        ChatMessageType.PHOTO -> message.objectKey
        ChatMessageType.VIDEO -> message.thumbnailObjectKey
    }

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

        ChatMessageType.VIDEO -> ChatMessage(
            roomId = roomId,
            senderId = memberId,
            type = ChatMessageType.VIDEO,
            objectKey = validateVideoKey(memberId, request.objectKey),
            thumbnailObjectKey = validatePhotoKey(memberId, request.thumbnailKey),
            durationSeconds = validateDuration(request.durationSeconds),
            replyToMessageId = replyTarget?.id,
            clientMessageId = request.clientMessageId,
        )
    }

    private fun validateVideoKey(memberId: Long, objectKey: String?): String {
        val key = validatePhotoKey(memberId, objectKey)
        val stored = photoStorage.head(key) ?: throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)

        if (stored.contentType?.startsWith(VIDEO_CONTENT_TYPE_PREFIX) != true) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }

        if (stored.contentLength > PhotoUploadService.VIDEO_MAX_BYTES) {
            photoStorage.delete(listOf(key))
            throw BusinessException(ErrorCode.VIDEO_TOO_LARGE)
        }

        return key
    }

    private fun validateDuration(durationSeconds: Int?): Int {
        if (durationSeconds == null || durationSeconds <= 0) {
            throw BusinessException(ErrorCode.INVALID_REQUEST)
        }

        if (durationSeconds > ChatMessage.VIDEO_MAX_SECONDS) {
            throw BusinessException(ErrorCode.VIDEO_TOO_LONG)
        }

        return durationSeconds
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
        private const val VIDEO_CONTENT_TYPE_PREFIX = "video/"
        private val MEDIA_TYPES = listOf(ChatMessageType.PHOTO, ChatMessageType.VIDEO)
    }
}
