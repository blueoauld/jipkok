package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminChatRoomStatus
import com.blueoauld.server.domain.admin.dto.projection.AdminChatRoomRow
import com.blueoauld.server.domain.admin.dto.response.AdminChatMemberResponse
import com.blueoauld.server.domain.admin.dto.response.AdminChatMessagePageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminChatMessageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminChatRoomDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminChatRoomPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminChatRoomResponse
import com.blueoauld.server.domain.admin.repository.ChatRoomAdminRepository
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AdminChatService(

    private val chatRoomAdminRepository: ChatRoomAdminRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val memberAdminService: MemberAdminService,
    private val photoStorage: PhotoStorage,
) {

    @Transactional(readOnly = true)
    fun findRooms(status: AdminChatRoomStatus?, memberId: Long?, page: Int, size: Int): AdminChatRoomPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)

        val rooms = chatRoomAdminRepository.findAllForAdmin(
            status = status?.name,
            memberId = memberId,
            size = safeSize,
            offset = AdminPaging.offset(safePage, safeSize),
        )
        val lastMessages = chatMessageRepository.findAllById(rooms.map { it.lastMessageId }.filter { it > 0 })
            .associateBy { it.id }
        val nicknames = memberAdminService.findNicknames(rooms.flatMap { listOf(it.lowMemberId, it.highMemberId) })

        return AdminChatRoomPageResponse(
            items = rooms.map { room ->
                val last = lastMessages[room.lastMessageId]

                AdminChatRoomResponse(
                    id = room.id,
                    low = AdminChatMemberResponse(room.lowMemberId, nicknames.getValue(room.lowMemberId)),
                    high = AdminChatMemberResponse(room.highMemberId, nicknames.getValue(room.highMemberId)),
                    lastMessageType = last?.type,
                    lastMessageContent = last?.content,
                    lastMessageAt = last?.createdAt,
                    createdAt = room.createdAt,
                    deletedAt = room.deletedAt,
                )
            },
            page = safePage,
            size = safeSize,
            totalCount = chatRoomAdminRepository.countForAdmin(status?.name, memberId),
        )
    }

    @Transactional(readOnly = true)
    fun findRoom(roomId: Long): AdminChatRoomDetailResponse {
        val room = getRoom(roomId)
        val memberIds = listOf(room.lowMemberId, room.highMemberId)
        val nicknames = memberAdminService.findNicknames(memberIds)

        return AdminChatRoomDetailResponse(
            id = room.id,
            members = memberIds.map { AdminChatMemberResponse(it, nicknames.getValue(it)) },
            createdAt = room.createdAt,
            deletedAt = room.deletedAt,
        )
    }

    @Transactional(readOnly = true)
    fun findMessages(roomId: Long, cursor: Long?, size: Int): AdminChatMessagePageResponse {
        getRoom(roomId)
        val safeSize = AdminPaging.size(size)
        val messages = chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(
            roomId,
            cursor ?: Long.MAX_VALUE,
            Limit.of(safeSize + 1),
        )
        val pageMessages = messages.take(safeSize)

        return AdminChatMessagePageResponse(
            items = pageMessages.asReversed().map(::toResponse),
            nextCursor = pageMessages.lastOrNull()?.id?.takeIf { messages.size > safeSize },
        )
    }

    private fun getRoom(roomId: Long): AdminChatRoomRow = chatRoomAdminRepository.findRowById(roomId)
        ?: throw BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND)

    private fun toResponse(message: ChatMessage) = AdminChatMessageResponse(
        id = message.id,
        senderId = message.senderId,
        type = message.type,
        content = message.content,
        photoUrl = when (message.type) {
            ChatMessageType.TEXT -> null
            ChatMessageType.PHOTO -> message.objectKey
            ChatMessageType.VIDEO -> message.thumbnailObjectKey
        }?.let(photoStorage::createSignedViewUrl),
        videoUrl = message.objectKey
            ?.takeIf { message.type == ChatMessageType.VIDEO }
            ?.let(photoStorage::createSignedViewUrl),
        createdAt = message.createdAt,
    )
}
