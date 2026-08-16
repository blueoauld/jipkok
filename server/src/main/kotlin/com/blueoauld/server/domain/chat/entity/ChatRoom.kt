package com.blueoauld.server.domain.chat.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.SoftDelete
import org.hibernate.annotations.SoftDeleteType

@SoftDelete(strategy = SoftDeleteType.TIMESTAMP, columnName = "deleted_at")
@Entity
@Table(name = "chat_room")
class ChatRoom(

    @Column(name = "low_member_id", nullable = false, updatable = false)
    val lowMemberId: Long,

    @Column(name = "high_member_id", nullable = false, updatable = false)
    val highMemberId: Long,

    @Column(name = "last_message_id", nullable = false)
    var lastMessageId: Long = 0,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    fun partnerIdOf(memberId: Long) = if (memberId == lowMemberId) highMemberId else lowMemberId

    fun contains(memberId: Long) = memberId == lowMemberId || memberId == highMemberId

    companion object {

        const val BULK_MAX_COUNT = 100

        fun of(memberId: Long, partnerId: Long) = ChatRoom(
            lowMemberId = minOf(memberId, partnerId),
            highMemberId = maxOf(memberId, partnerId),
        )
    }
}
