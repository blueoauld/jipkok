package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.admin.dto.projection.AdminChatRoomRow
import com.blueoauld.server.domain.chat.entity.ChatRoom
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ChatRoomAdminRepository : JpaRepository<ChatRoom, Long> {

    @Query(
        value = """
        $SELECT_ROW
        where $STATUS $MEMBER
        order by r.last_message_id desc
        limit :size offset :offset
        """,
        nativeQuery = true,
    )
    fun findAllForAdmin(
        @Param("status") status: String?,
        @Param("memberId") memberId: Long?,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<AdminChatRoomRow>

    @Query(
        value = """
        select count(*)
        from chat_room r
        where $STATUS $MEMBER
        """,
        nativeQuery = true,
    )
    fun countForAdmin(@Param("status") status: String?, @Param("memberId") memberId: Long?): Long

    @Query(
        value = """
        $SELECT_ROW
        where r.id = :roomId
        """,
        nativeQuery = true,
    )
    fun findRowById(@Param("roomId") roomId: Long): AdminChatRoomRow?

    companion object {

        private const val SELECT_ROW = """select r.id as id,
               r.low_member_id as lowMemberId,
               r.high_member_id as highMemberId,
               r.last_message_id as lastMessageId,
               r.created_at as createdAt,
               r.deleted_at as deletedAt
        from chat_room r"""

        private const val STATUS = """(cast(:status as varchar) is null
            or (:status = 'DELETED' and r.deleted_at is not null)
            or (:status = 'ACTIVE' and r.deleted_at is null))"""

        private const val MEMBER = """and (cast(:memberId as bigint) is null
            or r.low_member_id = cast(:memberId as bigint)
            or r.high_member_id = cast(:memberId as bigint))"""
    }
}
