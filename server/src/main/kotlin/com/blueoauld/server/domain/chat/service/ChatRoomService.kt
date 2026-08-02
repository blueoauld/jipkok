package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.projection.ChatRoomRow
import com.blueoauld.server.domain.chat.dto.response.ChatRoomResponse
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.event.ChatRoomDeletedEvent
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatRoomService(

    private val chatRoomRepository: ChatRoomRepository,
    private val memberSummaryService: MemberSummaryService,
    private val eventPublisher: ApplicationEventPublisher,
) {

    @Transactional(readOnly = true)
    fun findRoom(memberId: Long, roomId: Long): ChatRoomResponse {
        val row = chatRoomRepository.findRoom(memberId, roomId)
            ?: throw BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND)
        val partner = memberSummaryService.findSummaries(listOf(row.getPartnerId())).firstOrNull()
            ?: throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)

        return ChatRoomResponse.of(row, partner)
    }

    @Transactional(readOnly = true)
    fun findRooms(memberId: Long, unreadOnly: Boolean, cursor: Long?, size: Int): CursorResponse<ChatRoomResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val rows = chatRoomRepository.findRooms(
            memberId = memberId,
            minUnreadCount = if (unreadOnly) 1 else 0,
            cursor = cursor ?: Long.MAX_VALUE,
            limit = Limit.of(pageSize),
        )

        return toResponse(rows, pageSize)
    }

    @Transactional(readOnly = true)
    fun searchRooms(memberId: Long, keyword: String, cursor: Long?, size: Int): CursorResponse<ChatRoomResponse> {
        val trimmed = keyword.trim()

        if (trimmed.isEmpty()) {
            return CursorResponse(items = emptyList(), nextCursor = null)
        }

        val pageSize = CursorResponse.pageSize(size)
        val rows = chatRoomRepository.searchRooms(
            memberId = memberId,
            keyword = "%${escapeLike(trimmed)}%",
            cursor = cursor ?: Long.MAX_VALUE,
            limit = Limit.of(pageSize),
        )

        return toResponse(rows, pageSize)
    }

    @Transactional
    fun leave(memberId: Long, roomId: Long) {
        val room = chatRoomRepository.findById(roomId)
            .filter { it.contains(memberId) }
            .orElseThrow { BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND) }

        delete(room, room.partnerIdOf(memberId))
    }

    @Transactional
    fun deleteBetween(memberId: Long, partnerId: Long) {
        chatRoomRepository.findByMembers(memberId, partnerId)?.let { delete(it, partnerId) }
    }

    private fun toResponse(rows: List<ChatRoomRow>, pageSize: Int): CursorResponse<ChatRoomResponse> {
        val partners = memberSummaryService.findSummaries(rows.map { it.getPartnerId() })
            .associateBy { it.memberId }

        return CursorResponse(
            items = rows.mapNotNull { row -> partners[row.getPartnerId()]?.let { ChatRoomResponse.of(row, it) } },
            nextCursor = rows.lastOrNull()?.getLastMessageId().takeIf { rows.size == pageSize },
        )
    }

    private fun escapeLike(keyword: String) = keyword
        .replace("""\""", """\\""")
        .replace("%", """\%""")
        .replace("_", """\_""")

    private fun delete(room: ChatRoom, partnerId: Long) {
        chatRoomRepository.delete(room)
        eventPublisher.publishEvent(ChatRoomDeletedEvent(partnerId, room.id))
    }
}
