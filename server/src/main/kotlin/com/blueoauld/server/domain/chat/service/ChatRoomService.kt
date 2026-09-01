package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.projection.ChatRoomRow
import com.blueoauld.server.domain.chat.dto.response.ChatRoomResponse
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import com.blueoauld.server.domain.chat.event.ChatRoomDeletedEvent
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.repository.getRoomOf
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.repository.escapeLike
import com.blueoauld.server.global.request.EnabledRequest
import com.blueoauld.server.global.response.CursorResponse
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatRoomService(

    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
    private val memberSummaryService: MemberSummaryService,
    private val eventPublisher: ApplicationEventPublisher,
) {

    @Transactional(readOnly = true)
    fun findUnreadCount(memberId: Long) = chatRoomMemberRepository.sumUnreadCount(memberId)

    @Transactional(readOnly = true)
    fun findRoom(memberId: Long, roomId: Long): ChatRoomResponse {
        val row = chatRoomRepository.findRoom(memberId, roomId)
            ?: throw BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND)
        val partner = memberSummaryService.findSummaries(memberId, listOf(row.getPartnerId())).firstOrNull()
            ?: throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)

        return ChatRoomResponse.of(row, partner)
    }

    @Transactional(readOnly = true)
    fun findRooms(memberId: Long, unreadOnly: Boolean, cursor: Long?, size: Int): CursorResponse<ChatRoomResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val minUnreadCount = if (unreadOnly) 1 else 0
        val pinnedRows = if (cursor == null) {
            chatRoomRepository.findPinnedRooms(memberId, minUnreadCount)
        } else {
            emptyList()
        }
        val rows = chatRoomRepository.findRooms(
            memberId = memberId,
            minUnreadCount = minUnreadCount,
            cursor = cursor ?: Long.MAX_VALUE,
            limit = Limit.of(pageSize),
        )

        return toResponse(memberId, rows, pageSize, pinnedRows)
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
            keyword = "%${trimmed.escapeLike()}%",
            cursor = cursor ?: Long.MAX_VALUE,
            limit = Limit.of(pageSize),
        )

        return toResponse(memberId, rows, pageSize)
    }

    @Transactional
    fun updateNotification(memberId: Long, roomId: Long, request: EnabledRequest) {
        val roomMember = chatRoomMemberRepository.findByRoomIdAndMemberId(roomId, memberId)
            ?: throw BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND)

        roomMember.notificationEnabled = request.enabled
    }

    @Transactional
    fun updatePin(memberId: Long, roomId: Long, request: EnabledRequest) {
        val roomMember = chatRoomMemberRepository.findByRoomIdAndMemberId(roomId, memberId)
            ?: throw BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND)

        if (request.enabled && !roomMember.pinned) {
            checkPinLimit(memberId)
        }

        roomMember.pinned = request.enabled
    }

    private fun checkPinLimit(memberId: Long) {
        if (chatRoomMemberRepository.countByMemberIdAndPinnedTrue(memberId) >= ChatRoomMember.PIN_MAX_COUNT) {
            throw BusinessException(ErrorCode.PIN_LIMIT_EXCEEDED)
        }
    }

    @Transactional
    fun leave(memberId: Long, roomId: Long) {
        val room = chatRoomRepository.getRoomOf(memberId, roomId)

        delete(room, room.partnerIdOf(memberId))
    }

    @Transactional
    fun leaveAll(memberId: Long, roomIds: List<Long>) {
        deleteAll(memberId, chatRoomRepository.findAllById(roomIds).filter { it.contains(memberId) })
    }

    @Transactional
    fun deleteBetween(memberId: Long, partnerId: Long) {
        chatRoomRepository.findByMembers(memberId, partnerId)?.let { delete(it, partnerId) }
    }

    private fun toResponse(
        memberId: Long,
        rows: List<ChatRoomRow>,
        pageSize: Int,
        pinnedRows: List<ChatRoomRow> = emptyList(),
    ): CursorResponse<ChatRoomResponse> {
        val allRows = pinnedRows + rows
        val partners = memberSummaryService.findSummaries(memberId, allRows.map { it.getPartnerId() })
            .associateBy { it.memberId }

        return CursorResponse(
            items = allRows.mapNotNull { row -> partners[row.getPartnerId()]?.let { ChatRoomResponse.of(row, it) } },
            nextCursor = rows.lastOrNull()?.getLastMessageId().takeIf { rows.size == pageSize },
        )
    }

    @Transactional
    fun delete(room: ChatRoom, partnerId: Long) {
        chatRoomRepository.delete(room)
        eventPublisher.publishEvent(ChatRoomDeletedEvent(partnerId, room.id))
    }

    @Transactional
    fun deleteAll(memberId: Long, rooms: List<ChatRoom>) {
        if (rooms.isEmpty()) {
            return
        }

        chatRoomRepository.softDeleteAllByIdIn(rooms.map { it.id })
        rooms.forEach { eventPublisher.publishEvent(ChatRoomDeletedEvent(it.partnerIdOf(memberId), it.id)) }
    }
}
