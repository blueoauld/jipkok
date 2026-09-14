package com.blueoauld.server.domain.ai.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate

@DynamicUpdate
@Entity
@Table(name = "ai_room_memory")
class AiRoomMemory(

    @Id
    @Column(name = "room_id")
    val roomId: Long,

    @Column(name = "ai_member_id", nullable = false, updatable = false)
    val aiMemberId: Long,

    @Column(name = "summary", nullable = false, columnDefinition = "TEXT")
    var summary: String,

    @Column(name = "summarized_message_id", nullable = false)
    var summarizedMessageId: Long,
) : BaseEntity() {

    fun update(summary: String, summarizedMessageId: Long) {
        this.summary = summary
        this.summarizedMessageId = summarizedMessageId
    }

    companion object {

        const val SUMMARY_MAX_CHARS = 500
        const val REFRESH_EVERY_MESSAGES = 20
        const val INPUT_MAX_MESSAGES = 60
    }
}
